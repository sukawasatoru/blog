/*
 * Copyright 2021, 2022 sukawasatoru
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
use clap::Parser;
use futures::future::BoxFuture;
use futures::FutureExt;
use serde::Serialize;
use std::path::{Path, PathBuf};
use stork_lib::{build_index, Config};
use tokio::fs::{canonicalize, read_dir, symlink_metadata, File};
use tokio::io::{AsyncReadExt, AsyncWriteExt, BufReader, BufWriter};
use tracing::{debug, info};

#[derive(Parser)]
struct Opt {
    /// The path of the out directory
    #[clap(parse(from_os_str))]
    dir: PathBuf,

    /// The path of source of the docs directory
    #[clap(short, long, parse(from_os_str))]
    md_dir: PathBuf,

    /// Destination of the stork file
    #[clap(short, long, parse(from_os_str))]
    out: PathBuf,

    /// Override file
    #[clap(short, long)]
    force: bool,

    /// Print verbose log
    #[clap(short, long, parse(from_occurrences))]
    verbose: u8,
}

#[tokio::main]
async fn main() -> Fallible<()> {
    let opt: Opt = Opt::parse();

    setup_log(opt.verbose);

    info!("Hello");

    if !opt.force && opt.out.exists() {
        anyhow::bail!("The file already exists: {:?}", opt.out);
    }

    let files = walk_dir(&opt.dir).await?;
    let out_dir = canonicalize(&opt.dir).await?;

    let mut stork_config = StorkConfig {
        input: InputConfig {
            base_directory: out_dir
                .to_str()
                .with_context(|| format!("out_dir.to_str: {:?}", out_dir))?
                .to_string(),
            stemming: "None".into(),
            files: vec![],
            minimum_indexed_substring_length: 2,
        },
    };

    let mut buf_str = String::new();
    for entry in files {
        let entry = canonicalize(entry).await?;
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
                    if !md_path.exists() {
                        md_path.set_extension("mdx");
                    }

                    debug!(?md_path);
                    buf_str.clear();
                    BufReader::new(File::open(&md_path).await?)
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

        let stork_entity = StorkFile {
            title: md_info
                .map(|data| data.title())
                .unwrap_or_else(|| stem.to_string()),
            url: std::env::var("PATH_CONTEXT")
                .unwrap_or_else(|_| "/".into())
                .parse::<PathBuf>()?
                .join(&stork_entry_url)
                .to_str()
                .with_context(|| format!("StorkFile.url {:?}", stork_entry_url))?
                .to_string(),
            path: entry
                .to_str()
                .with_context(|| format!("entry.to_str: {:?}", entry))?
                .to_string(),
        };
        info!(?stork_entity);

        stork_config.input.files.push(stork_entity);
    }

    let index = build_index(&Config::try_from(toml::to_string(&stork_config)?.as_str())?)?;
    info!(?index.description);
    let mut writer = BufWriter::new(File::create(&opt.out).await?);
    writer.write_all(&index.bytes).await?;
    writer.flush().await?;

    info!("succeeded");

    Ok(())
}

fn walk_dir(target_dir: &Path) -> BoxFuture<Fallible<Vec<PathBuf>>> {
    async move {
        let mut read_dir = read_dir(target_dir).await?;
        let mut files = vec![];
        while let Some(dir_entry) = read_dir.next_entry().await? {
            let dir_entry_path = dir_entry.path();
            let symlink_meta = symlink_metadata(&dir_entry_path).await?;
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

fn setup_log(level: u8) {
    let builder = tracing_subscriber::fmt();
    match std::env::var(tracing_subscriber::EnvFilter::DEFAULT_ENV) {
        Ok(data) => {
            let builder = builder.with_env_filter(tracing_subscriber::EnvFilter::new(data));
            match level {
                0 => builder.init(),
                1 => builder.with_max_level(tracing::Level::DEBUG).init(),
                _ => builder.with_max_level(tracing::Level::TRACE).init(),
            }
        }
        Err(_) => match level {
            0 => builder.with_max_level(tracing::Level::INFO).init(),
            1 => builder.with_max_level(tracing::Level::DEBUG).init(),
            _ => builder.with_max_level(tracing::Level::TRACE).init(),
        },
    }
}

#[derive(Debug, Serialize)]
pub struct StorkFile {
    pub title: String,
    pub url: String,
    pub path: String,
}

#[derive(Serialize)]
pub struct InputConfig {
    pub base_directory: String,
    pub stemming: String,
    pub minimum_indexed_substring_length: u8,
    pub files: Vec<StorkFile>,
}

/// https://stork-search.net/docs/config-ref
#[derive(Serialize)]
pub struct StorkConfig {
    pub input: InputConfig,
}
