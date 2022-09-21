export default function({useCollection}) { return {

  props: ['ID'],
  setup: (props)=> ({
    names: useCollection(()=>({
      name: { $type: 'string' },
      timestamp: { $type: 'number' },
      _by: props.ID
    }))
  }),

  template: `
      {{ names.length? names.sortBy('-timestamp')[0].name : 'Anonymous' }}`
}}
