<template>
  <v-card class="ma-2" outlined>
    <v-card-title>{{ name }}</v-card-title>
    <v-card-text>
      <div>จำนวนคงเหลือ: {{ stockqnt }}</div>
      <div>ขั้นต่ำ: {{ minqnt }}</div>
    </v-card-text>
  </v-card>
</template>

<script setup>
const props = defineProps({
  name: String,
  stockqnt: Number,
  minqnt: Number
})
</script>
