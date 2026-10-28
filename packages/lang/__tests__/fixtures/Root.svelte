<script lang="ts">
  import { createLang, setLang } from "@tolki/lang/svelte";

  import Greeting from "./Greeting.svelte";

  const { lang }: { lang: ReturnType<typeof createLang> } = $props();

  // svelte-ignore state_referenced_locally
  setLang(lang);
</script>

<Greeting />
