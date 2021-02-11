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

// https://github.com/react-syntax-highlighter/react-syntax-highlighter/blob/master/src/index.js
declare module "react-syntax-highlighter" {
  import {FunctionComponent} from "react";
  export const LightAsync: any;
  export const Light: FunctionComponent & any;
  export const PrismAsyncLight: any;
  export const PrismAsync: any;
  export const PrismLight: FunctionComponent & any;
  export const Prism: FunctionComponent & any;
  export const createElement: any;
}
