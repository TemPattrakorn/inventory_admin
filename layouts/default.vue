<template>
    <v-app>
        <v-navigation-drawer
        class="bg-blue-grey-darken-3"
        theme="dark"
        >
            <v-list-item title="My Application" subtitle="Vuetify"></v-list-item>
            <v-divider></v-divider>
            <v-list nav>
              <v-list-item prepend-icon="mdi-home" link to="/" title="หน้าหลัก"></v-list-item>
              <v-list-item prepend-icon="mdi-pencil" link to="/manage" title="จัดการวัสดุ"></v-list-item>
              <v-list-item prepend-icon="mdi-history" link to="/history" title="ประวัติการเบิกใช้"></v-list-item>
              <v-list-item prepend-icon="mdi-account" link to="/user" title="จัดการรายชื่อบุคลากร"></v-list-item>
              <v-list-item prepend-icon="mdi-file-chart" link to="/report" title="รายงานวัสดุคงเหลือ"></v-list-item>
            </v-list>

        <template v-slot:append>
          <div class="pa-2">
            <v-btn block>
              Logout
            </v-btn>
          </div>
        </template>
        </v-navigation-drawer>
        <v-main >
            <slot />
        </v-main>
    </v-app>
</template>

