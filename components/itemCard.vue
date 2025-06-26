<template>
  <v-card class="ma-2" outlined>
    <v-row align="center" no-gutters>
      <v-col cols="11">
        <v-img v-if="imageUrl" :src="imageUrl" height="180" cover class="mb-2" />
        <v-card-title>{{ name }}</v-card-title>
        <v-card-text>
          <div>จำนวนคงเหลือ: {{ stockqnt }}</div>
          <div>ขั้นต่ำ: {{ minqnt }}</div>
        </v-card-text>
      </v-col>
      <v-col cols="1" class="d-flex justify-end">
        <v-menu location="right" offset-x>
          <template #activator="{ props }">
            <v-btn v-bind="props" icon variant="text">
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item>
              <v-btn variant="text" block>Add item quantity</v-btn>
            </v-list-item>
            <v-list-item>
              <v-btn variant="text" block>Edit item</v-btn>
            </v-list-item>
            <v-list-item>
              <v-btn variant="text" block color="error">Delete item</v-btn>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup>
const props = defineProps({
  name: String,
  stockqnt: Number,
  minqnt: Number,
  imageUrl: String
})
</script>
