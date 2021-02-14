/*
 * Copyright 2021 sukawasatoru
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

use anyhow::{Context, Result as Fallible};
use futures::future::BoxFuture;
use futures::FutureExt;
use std::path::{Path, PathBuf};
use structopt::StructOpt;
use tokio::io::AsyncReadExt;
use tracing::{debug, info};

#[derive(StructOpt)]
struct Opt {
    /// The path of the out directory
    #[structopt(parse(from_os_str))]
    dir: PathBuf,

    /// The path of source of the docs directory
    #[structopt(short, long, parse(from_os_str))]
    md_dir: PathBuf,

    /// Destination of the stork file
    #[structopt(short, long, parse(from_os_str))]
    out: PathBuf,

    /// Override file
    #[structopt(short, long)]
    force: bool,
}

#[tokio::main]
async fn main() -> Fallible<()> {
    tracing_subscriber::fmt::init();

    info!("Hello");

    let opt: Opt = Opt::from_args();

    if !opt.force && opt.out.exists() {
        anyhow::bail!("The file already exists: {:?}", opt.out);
    }

    let files = walk_dir(&opt.dir).await?;
    let out_dir = std::fs::canonicalize(&opt.dir)?;

    let mut stork_config = stork_search::config::Config {
        input: stork_search::config::InputConfig {
            base_directory: out_dir
                .to_str()
                .with_context(|| format!("out_dir.to_str: {:?}", out_dir))?
                .to_string(),
            stemming: stork_search::config::StemmingConfig::None,
            minimum_indexed_substring_length: 2,
            ..Default::default()
        },
        output: stork_search::config::OutputConfig {
            filename: opt
                .out
                .to_str()
                .with_context(|| format!("out.to_str: {:?}", opt.out))?
                .to_string(),
            ..Default::default()
        },
    };

    let mut buf_str = String::new();
    for entry in files {
        let entry = std::fs::canonicalize(entry)?;
        match entry.extension() {
            Some(extension) => {
                if extension
                    .to_str()
                    .with_context(|| format!("to_str: {:?}", entry))?
                    != "html"
                {
                    debug!(?entry, "not html");
                    continue;
                }
            }
            None => {
                debug!(?entry, "no extension");
                continue;
            }
        };

        let stork_entry_url = entry.strip_prefix(&out_dir)?.with_extension("");

        debug!(?stork_entry_url);
        match stork_entry_url
            .to_str()
            .with_context(|| format!("to_str: {:?}", entry))?
        {
            "feed" => {
                debug!(?entry, "skip feed.html of root directory");
                continue;
            }
            "index" => {
                debug!(?entry, "skip index.html of root directory");
                continue;
            }
            "404" => {
                debug!(?entry, "skip error page");
                continue;
            }
            _ => {
                // do nothing.
            }
        };

        let stem = entry
            .file_stem()
            .with_context(|| format!("entry.stem: {:?}", entry))?
            .to_str()
            .with_context(|| format!("entry.to_str: {:?}", entry))?;

        let md_info = match entry.parent() {
            Some(parent_path) => match parent_path
                .file_name()
                .with_context(|| format!("parent_path.file_name(): {:?}", parent_path))?
                .to_str()
                .with_context(|| format!("parent.to_str: {:?}", entry))?
            {
                "docs" => {
                    let mut md_path = opt.md_dir.join(stem);
                    md_path.set_extension("md");

                    debug!(?md_path);
                    buf_str.clear();
                    tokio::io::BufReader::new(tokio::fs::File::open(&md_path).await?)
                        .read_to_string(&mut buf_str)
                        .await?;
                    match docs_parser::parse_docs(&buf_str) {
                        Some(data) => Some(data),
                        None => {
                            anyhow::bail!("unexpected data");
                        }
                    }
                }
                _ => None,
            },
            None => None,
        };

        let stork_entity = stork_search::config::File {
            title: md_info
                .map(|data| data.title())
                .unwrap_or_else(|| stem.to_string()),
            url: std::env::var("PATH_CONTEXT")
                .unwrap_or_else(|_| "/".into())
                .parse::<PathBuf>()?
                .join(stork_entry_url)
                .to_str()
                .with_context(|| format!(""))?
                .to_string(),
            source: stork_search::config::DataSource::FilePath(
                entry
                    .to_str()
                    .with_context(|| format!("entry.to_str: {:?}", entry))?
                    .to_string(),
            ),
            ..Default::default()
        };
        info!(?stork_entity);

        stork_config.input.files.push(stork_entity);
    }

    let index = stork_search::build(&stork_config)?;
    index.write(&stork_config)?;

    info!("succeeded");

    Ok(())
}

fn walk_dir(target_dir: &Path) -> BoxFuture<Fallible<Vec<PathBuf>>> {
    async move {
        let mut read_dir = tokio::fs::read_dir(target_dir).await?;
        let mut files = vec![];
        while let Some(dir_entry) = read_dir.next_entry().await? {
            let dir_entry_path = dir_entry.path();
            let symlink_meta = tokio::fs::symlink_metadata(&dir_entry_path).await?;
            let symlink_file_type = symlink_meta.file_type();

            if symlink_file_type.is_dir() {
                debug!(?dir_entry_path, "dir");

                let mut ret = walk_dir(&dir_entry_path).await?;
                files.append(&mut ret);
            } else if symlink_file_type.is_file() {
                debug!(?dir_entry_path, "file");

                files.push(dir_entry_path);
            } else {
                unreachable!();
            }
        }
        Ok(files)
    }
    .boxed()
}
