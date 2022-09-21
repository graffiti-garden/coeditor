export default function({toggleLogIn, myID, useCollection}) { return {

  setup: ()=> ({
    toggleLogIn, myID
  }),

  template: `
    <template v-if="myID">
      <header>
        <menu>
          <li>
            <a href="..">
              Graffiti Homepage
            </a>
          </li>
          <li>
            <router-link to="/">
              My Documents
            </router-link>
          </li>
          <li>
            <a href="" @click.prevent="toggleLogIn">
              Log Out
            </a>
          </li>
        </menu>
      </header>
      <main>
        <RouterView/>
      </main>
    </template>
    <template v-else>
      <main>
        <dialog>
          <h1>
            Graffiti Coeditor
          </h1>
          <menu>
            <li>
              <button @click="toggleLogIn">
                Log In With Graffiti
              </button>
            </li>
          </menu>
        </dialog>
      </main>
    </template>`
}}
