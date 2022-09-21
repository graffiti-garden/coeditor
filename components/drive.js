export default function({myID, useCollection}) { return {
setup: ()=> ({
    files: useCollection({
      id: { $type: 'string' },
      timestamp: { $type: 'number' },
      type: 'text/plain',
      _by: myID,
      _to: myID
    })
  }),

  data: ()=> ({
    editFile: null 
  }),

  methods: {

    newFile() {
      this.files.update({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'text/plain',
        // Documents start as private
        _to: [myID],
        _inContextIf: [{
          _queryFailsWithout: ['_to.0']
        }]
      })
    },

    startRename(file) {
      this.endRename()
      this.editFile = file
      if (!('name' in file)) {
        file.name = ''
      }
    },

    endRename() {
      if (this.editFile) {
        this.files.update(this.editFile)
        this.editFile = null
      }
    }

  },

  template: `
    <dialog>
      <button @click="newFile">
        ➕ New File
      </button>

      <table>
        <tr>
          <th></th>
          <th>
            Name
          </th>
          <th>
            Created
          </th>
        </tr>
        <tr v-for="file in files.sortBy('-timestamp')" :key="file.id">
          <td>
            <router-link :to="'/document/'+file.id">
              <button>
                🔗
              </button>
            </router-link>
          </td>
          <td>
            <a v-if="editFile!==file" href="" @click.prevent="startRename(file)">
              <template v-if="'name' in file">
                {{file.name}}
              </template>
              <template v-else>
                unnamed
              </template>
            </a>
            <form @submit.prevent="endRename" v-else>
              <input v-model="file.name" @focus="$event.target.select()" v-focus />
            </form>
          </td>
          <td>
            {{new Date(file.timestamp)
              .toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: 'numeric'
              })}}
          </td>
          <td>
            <button @click="files.remove(file)">
              ❌
            </button>
          </td>
        </tr>
      </table>
    </dialog>`
}}
