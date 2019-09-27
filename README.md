# vue-async-state

Simplest way to get async result / feedback in use vue composition api

## Installation

via npm:
``` bash
$ npm install vue-async-state
```

## Usage

The project inspired by [react-async-hook](https://github.com/slorber/react-async-hook) and implement roughly the same api.

``` typescript
// demo 1
import { createComponent, PropType, ref, toRefs } from '@vue/composition-api';
import { useAsyncSelf } from 'vue-async-state';

type Item = { value: string; text: string };
interface FetchMethod {
  (query: string): Item[]
  (query: string): Promise<Item[]>
}

export default createComponent({
  props: {
    fetchMethod: (Function as any) as PropType<FetchMethod>
  },
  setup(props, ctx) {
    const query = ref('');
    // const options = useAsyncSelf([query], props.fetchMethod!);
    const options = useAsyncSelf(query, props.fetchMethod!);
    const { loading, result } = toRefs(options);
    return {
      query,
      loading,
      result
    };
  }
});

// demo 2
import { createComponent, PropType, ref } from '@vue/composition-api';
import { useAsyncAbortable } from 'vue-async-state';

type Item = { value: string; text: string };
interface FetchMethod {
  (signal: AbortSignal, query: string): Item[]
  (signal: AbortSignal, query: string): Promise<Item[]>
}

export default createComponent({
  props: {
    fetchMethod: (Function as any) as PropType<FetchMethod>
  },
  setup(props, ctx) {
    const query = ref('');
    // const options = useAsyncAbortable([query], props.fetchMethod!);
    const options = useAsyncAbortable(query, props.fetchMethod!);
    return {
      query,
      options
    };
  }
});
```

## Related

[react-async-hook](https://github.com/slorber/react-async-hook) - React hook to handle any async operation in React components

## License

MIT
