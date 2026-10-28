<script lang="ts">
  import { getLang } from "@tolki/lang/svelte";

  const { __, transChoice } = getLang();
  const lang = getLang();
</script>

<div>
  <p>{__("Welcome")}</p>
  <p>{transChoice("messages.apples", 2)}</p>
  <p>{lang.locale}</p>
</div>
