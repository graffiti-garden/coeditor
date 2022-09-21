import Logoot from 'https://graffiti.csail.mit.edu/graffiti-x-js/logoot.js'

export default function({myID, useCollection}) { return {

  setup: ()=> useCollection({
    id: { $type: 'string' },
    timestamp: { $type: 'number' },
    $or: [{
      string: { $type: 'string' },
      ...Logoot.query('order')
    }, {
      type: 'tombstone'
    }]
  }),

  computed: {
    characterGroups() {
      // Group both the characters and tombstones by their ID
      const groups = this.objects.reduce((chain, obj)=> ({
          ...chain,
          [obj.id]: [ ...(chain[obj.id] || []), obj]
        }), {})

      // Sort each group by timestamp
      // for last writer wins
      for (const id in groups) {
        groups[id] = groups[id].sort((a, b)=> b.timestamp-a.timestamp)
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
    }
  },

  data: ()=> ({
    cursorIndex: 0,
    cursorText: ''
  }),

  watch: {
    liveCharacters() {
      this.cursorIndex = Math.min(this.liveCharacters.length, this.cursorIndex)
    },
  },

  methods: {
    keydown(key) {
      if (key == "Enter") {
        key = "\n"
      }

      if (key == "ArrowLeft") {
        if (this.cursorIndex > 0) this.cursorIndex--
      } else if (key == "ArrowRight") {
        if (this.cursorIndex < this.liveCharacters.length) this.cursorIndex++

      } else if (key == "Backspace") {
        // Fetch the ID of the character being deleted
        if (this.cursorIndex == 0) return
        const id = this.liveCharacters[this.cursorIndex-1].id

        // If the only element is mine, delete
        const group = this.characterGroups[id]
        if (group.length == 1 && group[0]._by == myID) {
          this.remove(group[0])

        // Otherwise place a tombstone
        } else {
          this.update({
            type: "tombstone",
            id: id,
            timestamp: Date.now()
          })
        }

        // Move the cursor back one
        this.cursorIndex--

      } else if ( key.length == 1 ) {
        // Compute lower bounds on whether the element should 
        const lowerBound = (this.cursorIndex==0)?
          Logoot.before : this.liveCharacters[this.cursorIndex-1].order
        const upperBound = (this.cursorIndex==this.liveCharacters.length)?
          Logoot.after : this.liveCharacters[this.cursorIndex].order

        this.update({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          string: key,
          order: Logoot.between(lowerBound, upperBound)
        })
        this.cursorIndex++
      }
    }
  },

  directives: {
    focus: {
      mounted: (el) => el.focus()
    }
  },

  template: `
    <input autofocus v-focus v-if="cursorIndex==0"
      @keydown="keydown($event.key)"/>
    <template v-for="(character, index) of liveCharacters">
      {{ character.string }}<!>
      <input v-focus v-if="cursorIndex==index+1"
        @keydown="keydown($event.key)"/>
    </template>`
}}
