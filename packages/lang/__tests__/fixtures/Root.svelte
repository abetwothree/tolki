<script lang="ts">
  import { createLang, setLang } from "@tolki/lang/svelte";

  import Greeting from "./Greeting.svelte";

  const { lang }: { lang: ReturnType<typeof createLang> } = $props();

  // The lang is read once at init, like a provider's prop.
  // svelte-ignore state_referenced_locally
  setLang(lang);
</script>

<Greeting />
