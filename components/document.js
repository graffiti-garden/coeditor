import Logoot from 'https://graffiti.csail.mit.edu/graffiti-x-js/logoot.js'

export default function({myID, useCollection}) { return {

  props: ["ID"],

  setup: (props)=> ({
    characters: useCollection(()=> ({
      fileID: props.ID,
      id: { $type: 'string' },
      timestamp: { $type: 'number' },
      $or: [{
        string: { $type: 'string' },
        ...Logoot.query('order')
      }, {
        type: 'tombstone'
      }]
    }))
  }),

  computed: {
    characterGroups() {
      const groups = this.characters.groupBy('id')
      for (const id in groups) {
        groups[id] = groups[id].sortBy('-timestamp')
      }
      return groups
    },

    liveCharacters() {
      // For each ID
      return Object.keys(this.characterGroups)
        // Last writer wins in each group
        .map(id=> this.characterGroups[id][0])
        // Filter out any tombstones
        .filter(o=> o.type != 'tombstone')
        // Sort by logoot order
        .sort((a, b)=> Logoot.compare(a.order, b.order))
    },

    text() {
      return this.liveCharacters.reduce(
        (prev, curr)=> prev.concat(curr.string), '')
    }
  },

  methods: {
    async keydown(event) {

      const cursorIndex = event.target.selectionEnd

      let key = event.key
      if (key == "Enter") {
        key = "\n"
      }

      if (key == "Backspace") {
        event.preventDefault()

        // Fetch the ID of the character being deleted
        if (cursorIndex == 0) return
        const id = this.liveCharacters[cursorIndex-1].id

        // If the only element is mine, delete
        const group = this.characterGroups[id]
        if (group.length == 1 && group[0]._by == myID) {
          this.characters.remove(group[0])

        // Otherwise place a tombstone
        } else {
          this.characters.update({
            fileID: this.ID,
            type: "tombstone",
            id: id,
            timestamp: Date.now(),
            _inContextIf: [{
              _queryFailsWithout: ['fileID']
            }]
          })
        }

        // Move the cursor back one
        await this.$nextTick()
        event.target.selectionEnd = cursorIndex-1

      } else if ( key.length == 1 ) {
        event.preventDefault()

        // Compute lower bounds on whether the element should 
        const lowerBound = (cursorIndex==0)?
          Logoot.before : this.liveCharacters[cursorIndex-1].order
        const upperBound = (cursorIndex==this.liveCharacters.length)?
          Logoot.after : this.liveCharacters[cursorIndex].order

        this.characters.update({
          fileID: this.ID,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          string: key,
          order: Logoot.between(lowerBound, upperBound),
          _inContextIf: [{
            _queryFailsWithout: ['fileID']
          }]
        })
        await this.$nextTick()
        event.target.selectionEnd = cursorIndex+1
      }
    }
  },

  template: '<textarea @keydown="keydown($event)" :value="text" />'
}}
