<script>
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import Mixins from 'framework7-svelte/utils/mixins.js';
  import Utils from 'framework7-svelte/utils/utils.js';
  import restProps from 'framework7-svelte/utils/rest-props.js';
  import f7 from 'framework7-svelte/utils/f7.js';

  const dispatch = createEventDispatcher();

  let className = undefined;
  export { className as class };

  export let init = true;
  export let checked = undefined;
  export let disabled = undefined;
  export let readonly = undefined;
  export let name = undefined;
  export let value = undefined;

  let el;
  let inputEl;
  let f7Toggle;

  export function instance() {
    return f7Toggle;
  }

  export function toggle() {
    if (f7Toggle && f7Toggle.toggle) f7Toggle.toggle();
  }

  $: classes = Utils.classNames(
    'toggle',
    className,
    {
      disabled,
    },
    Mixins.colorClasses($$props),
  );

  let initialWatched = false;
  function watchChecked(isChecked) {
    if (!initialWatched) {
      initialWatched = true;
      return;
    }
    if (!f7Toggle) return;
    f7Toggle.checked = isChecked;
  }

  function onChange(event) {
    dispatch('change', [event]);
    if (typeof $$props.onChange === 'function') $$props.onChange(event);
  }

  onMount(() => {
    if (!init) return;
    f7.ready(() => {
      f7Toggle = f7.instance.toggle.create({
        el,
        on: {
          change(toggle) {
            dispatch('toggleChange', [toggle.checked]);
            if (typeof $$props.onToggleChange === 'function') $$props.onToggleChange(toggle.checked);
          },
        },
      });
    });
  });

  onDestroy(() => {
    if (f7Toggle && f7Toggle.destroy && f7Toggle.$el) f7Toggle.destroy();
  });
</script>

<label bind:this={el} class={classes} {...restProps($$restProps)}>
  <input
    bind:this={inputEl}
    type="checkbox"
    name={name}
    disabled={disabled}
    readonly={readonly}
    bind:checked={checked}
    bind:value={value}
    on:change={onChange}
  />
  <span class="toggle-icon" />
</label>
