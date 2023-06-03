use std::str::FromStr;
use wasm_bindgen::prelude::*;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

static VERBOSE: bool = false;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_u32(a: u32);

    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_many(a: &str, b: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => {
        if VERBOSE {
            if cfg!(feature="wasm") {
                log(&format_args!($($t)*).to_string())
            } else {
                #[cfg(not(feature="wasm"))]
                tracing::info!($($t)*)
            }
        }
    }
}

#[wasm_bindgen]
#[derive(Debug, Eq, PartialEq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DocEntry {
    title: String,
    first_edition: String,
    last_modify: Option<String>,
}

#[wasm_bindgen]
impl DocEntry {
    #[wasm_bindgen(getter)]
    pub fn title(&self) -> String {
        self.title.to_string()
    }

    #[wasm_bindgen(getter = firstEdition)]
    pub fn first_edition(&self) -> String {
        self.first_edition.to_string()
    }

    #[wasm_bindgen(getter = lastModify)]
    pub fn last_modify(&self) -> Option<String> {
        self.last_modify.as_ref().map(|data| data.to_string())
    }
}

#[wasm_bindgen(js_name = parseDocs)]
pub fn parse_docs(doc: &str) -> Option<DocEntry> {
    console_log!("parse_docs");

    let mut is_parse_date = false;
    let mut title = None;
    let mut first_edition = None;
    let mut last_modify = None;
    let mut prev_line = vec![];
    let first_regex = regex::Regex::new(r#"^([-0-9]*) \(First edition\)"#).unwrap();
    let modify_regex = regex::Regex::new(r#"^([-0-9]*) \(Last modify\)"#).unwrap();
    let title_sep_regex = regex::Regex::new(r#"^=+$"#).unwrap();

    for entry in doc.lines() {
        if title.is_none() {
            prev_line.push(entry);

            if 1 < prev_line.len() {
                if title_sep_regex.is_match(entry) {
                    title = Some(prev_line[0].to_string());
                }
                prev_line.remove(0);
            }
            continue;
        }

        if entry == "timestamp  " {
            is_parse_date = true;
            first_edition = None;
            last_modify = None;
            continue;
        }

        if !is_parse_date {
            continue;
        }

        if first_edition.is_none() {
            match first_regex.captures(entry) {
                Some(data) => match chrono::NaiveDate::from_str(&data[1]) {
                    Ok(data) => {
                        first_edition = Some(data);
                    }
                    Err(_) => {
                        // the timestamp marker may be body content.
                        is_parse_date = false;
                    }
                },
                None => {
                    is_parse_date = false;
                }
            };

            continue;
        }

        if let Some(data) = modify_regex.captures(entry) {
            match chrono::NaiveDate::from_str(&data[1]) {
                Ok(data) => last_modify = Some(data),
                Err(e) => {
                    console_log!("unexpected Last modify: {:?}", e);
                    return None;
                }
            }
        }

        is_parse_date = false;
    }

    if title.is_none() {
        console_log!("the title is None");
        return None;
    }

    if first_edition.is_none() {
        console_log!("the first_edition is None");
        return None;
    }

    Some(DocEntry {
        title: title.unwrap(),
        first_edition: first_edition.unwrap().to_string(),
        last_modify: last_modify.map(|data| data.to_string()),
    })
}

pub fn set_panic_hook() {
    #[cfg(feature = "wasm")]
    console_error_panic_hook::set_once();
}

#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;

    #[wasm_bindgen_test]
    fn parse_doc_normal() {
        let ret = parse_docs(
            r#"
Hello test
==========

this is body

- - -

timestamp  
2021-02-13 (First edition)"#,
        );

        let expect = Some(DocEntry {
            title: "Hello test".into(),
            first_edition: "2021-02-13".into(),
            last_modify: None,
        });
        assert_eq!(ret, expect);
    }

    #[wasm_bindgen_test]
    fn parse_doc_first_with_last() {
        let ret = parse_docs(
            r#"
Hello test
==========

this is body

- - -

timestamp  
2021-02-13 (First edition)  
2021-03-01 (Last modify)"#,
        );

        let expect = Some(DocEntry {
            title: "Hello test".into(),
            first_edition: "2021-02-13".into(),
            last_modify: Some("2021-03-01".into()),
        });
        assert_eq!(ret, expect);
    }

    #[wasm_bindgen_test]
    fn parse_doc_missing_title() {
        let ret = parse_docs(
            r#"
this is body

- - -

timestamp  
2021-02-13 (First edition)  
2021-03-01 (Last modify)"#,
        );

        assert_eq!(ret, None);
    }

    #[wasm_bindgen_test]
    fn parse_doc_missing_first_edition() {
        let ret = parse_docs(
            r#"
Hello test
==========

this is body

- - -

timestamp  
2021-03-01 (Last modify)"#,
        );

        assert_eq!(ret, None);
    }
}
