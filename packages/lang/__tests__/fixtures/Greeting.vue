<script setup lang="ts">
import { useLang } from "@tolki/lang/vue";

const { locale } = useLang();
</script>

<template>
  <div>
    <p>{{ __("Welcome") }}</p>
    <p>{{ transChoice("messages.apples", 2) }}</p>
    <p>{{ locale }}</p>
  </div>
</template>
