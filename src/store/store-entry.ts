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

import {Deserializer} from './deserializer';
import {Serializer} from './serializer';

export const loadValue = <T>(entry: StoreEntry<T>): T => {
  const val = localStorage.getItem(entry.key);
  if (val === null) {
    return entry.defaultValue;
  }
  const de = entry.deserializer.deserialize(val);
  return de === undefined ? entry.defaultValue : de;
};

export const storeValue = <T>(entry: StoreEntry<T>, value: T): void => {
  const val = entry.serializer.serialize(value);
  if (val === undefined) {
    console.warn(
      `failed to serialize value. key: ${entry.key}, value: ${value}`
    );
    return;
  }

  localStorage.setItem(entry.key, val);
};

export class StoreEntry<T> {
  readonly key: string;

  readonly serializer: Serializer<T>;

  readonly deserializer: Deserializer<T>;

  readonly defaultValue: T;

  constructor(
    key: string,
    serializer: Serializer<T>,
    deserializer: Deserializer<T>,
    defaultValue: T
  ) {
    this.key = key;
    this.serializer = serializer;
    this.deserializer = deserializer;
    this.defaultValue = defaultValue;
  }
}
