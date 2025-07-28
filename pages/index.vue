<template>
    <div style="background-color: #F5F5F5; min-height: 100%" >Hi from Index</div>
    <v-card text="..."></v-card>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })
</script>