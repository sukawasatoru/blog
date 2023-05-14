/*
 * Copyright 2022, 2023 sukawasatoru
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

import {Listbox, Transition} from '@headlessui/react';
import {ComputerDesktopIcon, MoonIcon, SunIcon} from '@heroicons/react/24/solid';
import clsx from 'clsx';
import {
  ComponentProps,
  FC,
  Fragment,
  PropsWithChildren,
  PropsWithoutRef,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {repo as prefsRepo} from '@/data/repository/preferences-repository';
import {useIsomorphicLayoutEffect} from '@/function/isomorphic-layout-effect';
import {Appearance} from '@/model/appearance';

const useColorMediaQuery = (): MediaQueryList => useMemo(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)') ||
    {matches: false} as MediaQueryList,
  [],
);

const updateClassList = (isDark: boolean) => {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // need to use transitions to clear div element if use transition in AppearanceSelector.
  // document.documentElement.classList.add('[&_*]:!transition-none');
  // sleep().then(() => document.documentElement.classList.remove('[&_*]:!transition-none'));
};

/**
 * undefined may be pre-rendered result.
 *
 * the undefined is required for `system` because `system` uses client value to render
 * so need to cause an effect after pre-rendered result.
 */
const useAppearance = (): [Appearance | undefined, (value: Appearance) => void, boolean] => {
  const [appearance, setAppearance] = useState<Appearance>();
  const initial = useRef(true);
  const mediaQuery = useColorMediaQuery();
  const [isSystemDark, setIsSystemDark] = useState(mediaQuery.matches);

  useIsomorphicLayoutEffect(() => {
    if (initial.current) {
      // initialize state after pre-rendered.
      setAppearance(prefsRepo.getAppearance());

      initial.current = false;

      // use appearance that set via _document.tsx.
    } else {
      appearance && prefsRepo.saveAppearance(appearance);
      switch (appearance) {
        case 'dark':
          updateClassList(true);
          break;
        case 'light':
          updateClassList(false);
          break;
        case 'system':
          updateClassList(mediaQuery.matches);
      }
    }
  }, [appearance]);

  // observe browser's appearance and update classList.
  useEffect(() => {
    const cb = (ev: MediaQueryListEvent) => {
      setIsSystemDark(ev.matches);
      if (prefsRepo.getAppearance() === 'system') {
        updateClassList(ev.matches);
      }
    };

    mediaQuery.addEventListener('change', cb);
    return () => mediaQuery.removeEventListener('change', cb);
  }, [mediaQuery]);

  return [appearance, setAppearance, isSystemDark];
};

const iconMap = {
  light: SunIcon,
  dark: MoonIcon,
  system: ComputerDesktopIcon,
};

export type Props = PropsWithChildren<PropsWithoutRef<ComponentProps<'div'>>>

export const AppearanceSelector: FC<Props> = (props) => {
  const [appearance, setAppearance, isSystemDark] = useAppearance();

  const ButtonIcon = useMemo(() => {
    const funcs = {
      light() {
        return iconMap['light'];
      },
      dark() {
        return iconMap['dark'];
      },
      system() {
        return isSystemDark ? iconMap['dark'] : iconMap['light'];
      },
    };

    return appearance && funcs[appearance]() || undefined;
  }, [appearance, isSystemDark]);

  return <Listbox as="div" {...props} value={appearance} onChange={setAppearance}>
    <Listbox.Label className="sr-only">
      Theme
    </Listbox.Label>
    <div className="relative">
      <Listbox.Button
        className="flex h-8 w-8 items-center justify-center rounded-lg shadow-md shadow-black/5 ring-1 ring-black/5 dark:bg-slate-700 dark:ring-inset dark:ring-white/5"
      >
        {ButtonIcon && <ButtonIcon
          className={clsx(
            'w-5',
            appearance !== 'system' && 'fill-sky-500' || 'fill-slate-400',
          )}
        />}
      </Listbox.Button>
      <Transition
        as={Fragment}
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <Listbox.Options
          className={clsx(
            'top-full mt-3 w-36 space-y-1 rounded-xl bg-white p-3 font-medium shadow-md shadow-black/5 ring-1 ring-black/5 dark:bg-slate-800 dark:ring-white/5 text-sm z-10',
            'absolute -translate-x-28', // position
          )}>
          {Object.entries(iconMap).map(([key, Icon]) =>
            <Listbox.Option
              key={key}
              value={key}
              className={({active, selected}) => clsx(
                'flex flex-row align-baseline items-center rounded-[0.625rem] p-1 cursor-pointer select-none',
                {
                  'text-sky-500': selected,
                  'text-slate-900 dark:text-white': active && !selected,
                  'text-slate-700 dark:text-slate-400': !active && !selected,
                  'bg-slate-100 dark:bg-slate-900/40': active,
                },
              )}
            >
              {({selected}) =>
                <>
                  <div className='rounded-md bg-white p-1 shadow ring-1 ring-slate-900/5 dark:bg-slate-700 dark:ring-inset dark:ring-white/5'>
                    <Icon
                      className={clsx(
                        'w-5',
                        selected ? 'fill-sky-500' : 'fill-slate-400',
                      )}
                    />
                  </div>
                  <div className='ml-3'>
                    {key}
                  </div>
                </>
              }
            </Listbox.Option>,
          )}
        </Listbox.Options>
      </Transition>
    </div>
  </Listbox>;
};
