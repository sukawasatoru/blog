/*
 * Copyright 2020 sukawasatoru
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

export class Deserializer<T> {
  static readonly string = new Deserializer<string>(value => value);

  static readonly stringArray = new Deserializer<string[]>(
    value => Deserializer.json.deserialize(value) as string[]
  );

  static readonly boolean = new Deserializer<boolean>(
    s => !!s && s.toLowerCase() === 'true'
  );

  static readonly number = new Deserializer<number>(value => {
    const ret = Number(value);
    if (isNaN(ret) || !isFinite(ret)) {
      return undefined;
    }
    return ret;
  });

  static readonly json = new Deserializer<object>(value => {
    if (!value || value === 'null') {
      return undefined;
    }
    try {
      return JSON.parse(value);
    } catch (e) {
      console.warn(`failed to parse value: ${e}`);
      return undefined;
    }
  });

  readonly deserialize: (value: string) => T | undefined;

  constructor(deserializer: (value: string) => T | undefined) {
    this.deserialize = deserializer;
  }
}
