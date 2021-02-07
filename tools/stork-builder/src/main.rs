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
use tracing::{debug, info};

#[derive(StructOpt)]
struct Opt {
    /// The path of the out directory
    #[structopt(parse(from_os_str))]
    dir: PathBuf,

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
    let out_dir = out_dir
        .to_str()
        .with_context(|| format!("to_str: {:?}", out_dir))?;

    let mut stork_config = stork_search::config::Config {
        input: stork_search::config::InputConfig {
            base_directory: out_dir.to_string(),
            stemming: stork_search::config::StemmingConfig::None,
            minimum_indexed_substring_length: 2,
            ..Default::default()
        },
        output: stork_search::config::OutputConfig {
            filename: opt
                .out
                .to_str()
                .with_context(|| format!("to_str: {:?}", opt.out))?
                .to_string(),
            ..Default::default()
        },
    };

    for entry in files {
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

        let path_str = std::fs::canonicalize(&entry)?;
        let path_str = path_str
            .to_str()
            .with_context(|| format!("to_str: {:?}", path_str))?;
        let trimmed = path_str
            .strip_prefix(out_dir)
            .with_context(|| format!("strip_prefix: {:?}", path_str))?;

        let stork_entry_url = trimmed.trim_end_matches(".html");

        // remove prefix "/".
        let stork_entry_path = &trimmed[1..];

        if stork_entry_path == "index.html" {
            debug!(?entry, "skip index.html of root directory");
            continue;
        }

        if stork_entry_path == "404.html" {
            debug!(?entry, "skip error page");
            continue;
        }

        let stork_entity = stork_search::config::File {
            title: entry
                .file_stem()
                .with_context(|| format!("entry.stem: {:?}", entry))?
                .to_str()
                .with_context(|| format!("entry.to_str: {:?}", entry))?
                .to_string(),
            url: stork_entry_url.into(),
            source: stork_search::config::DataSource::FilePath(stork_entry_path.into()),
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
