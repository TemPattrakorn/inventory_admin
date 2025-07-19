<template>
    <div>Hi from Index</div>
    <v-card text="..."></v-card>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })
</script>