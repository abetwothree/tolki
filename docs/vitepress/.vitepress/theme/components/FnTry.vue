<script setup lang="ts">
import { computed, reactive } from "vue";

type FnArgValue =
  | string
  | number
  | boolean
  | ((...args: never[]) => unknown)
  | unknown[]
  | Record<string, unknown>;

interface FnArgOption {
  label: string;
  value: FnArgValue;
}

interface FnArg {
  name: string;
  type?: "string" | "number" | "boolean" | "select" | "json";
  /** For "json" args, pass a real array/object — it's serialized for the textarea. */
  default: FnArgValue;
  /** Required when type is "select" — the list of presets to choose from. */
  options?: FnArgOption[];
}

const props = defineProps<{
  fn: (...args: never[]) => unknown;
  args: FnArg[];
}>();

const values = reactive<Record<string, FnArgValue>>(
  Object.fromEntries(
    props.args.map((arg) => [
      arg.name,
      arg.type === "json" ? JSON.stringify(arg.default, null, 2) : arg.default,
    ]),
  ),
);

const result = computed(() => {
  try {
    const ordered = props.args.map((arg) => {
      const value = values[arg.name];

      if (arg.type === "number") {
        // An empty field means "not provided" (many num functions treat a
        // missing argument, e.g. precision, differently than 0).
        return value === "" ? null : Number(value);
      }

      if (arg.type === "json") {
        return JSON.parse(value as string);
      }

      return value;
    });

    return { ok: true, value: (props.fn as (...a: unknown[]) => unknown)(...ordered) };
  } catch (error) {
    return {
      ok: false,
      value: error instanceof Error ? error.message : String(error),
    };
  }
});

function formatResult(value: unknown): string {
  if (typeof value === "string") {
    return `"${value}"`;
  }

  return JSON.stringify(value);
}
</script>

<template>
  <div class="fn-try">
    <p class="fn-try-eyebrow">▶ Try it</p>

    <div class="fn-try-inputs">
      <label
        v-for="arg in args"
        :key="arg.name"
        class="fn-try-field"
        :class="{
          'fn-try-field-checkbox': arg.type === 'boolean',
          'fn-try-field-json': arg.type === 'json',
        }"
      >
        <span class="fn-try-label">{{ arg.name }}</span>
        <input
          v-if="arg.type === 'boolean'"
          v-model="values[arg.name]"
          type="checkbox"
          class="fn-try-checkbox"
        />
        <select
          v-else-if="arg.type === 'select'"
          v-model="values[arg.name]"
          class="fn-try-input fn-try-select"
        >
          <option v-for="opt in arg.options" :key="opt.label" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <textarea
          v-else-if="arg.type === 'json'"
          v-model="values[arg.name]"
          class="fn-try-input fn-try-json"
          rows="2"
          spellcheck="false"
        />
        <input
          v-else
          v-model="values[arg.name]"
          type="text"
          :inputmode="arg.type === 'number' ? 'decimal' : 'text'"
          class="fn-try-input"
          spellcheck="false"
        />
      </label>
    </div>

    <div class="fn-try-output" :class="{ 'fn-try-error': !result.ok }">
      <span class="fn-try-output-label">{{
        result.ok ? "Result" : "Error"
      }}</span>
      <code>{{ result.ok ? formatResult(result.value) : result.value }}</code>
    </div>
  </div>
</template>

<style scoped>
.fn-try {
  margin: 16px 0 24px;
  padding: 16px 18px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
}

.fn-try-eyebrow {
  margin: 0 0 12px;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--vp-c-brand-1);
}

.fn-try-inputs {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.fn-try-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1 1 160px;
  min-width: 0;
}

.fn-try-field-checkbox {
  flex-direction: row;
  align-items: center;
  flex: 0 0 auto;
}

.fn-try-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  font-family: var(--vp-font-family-mono);
}

.fn-try-input {
  width: 100%;
  box-sizing: border-box;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.85rem;
  font-family: var(--vp-font-family-mono);
}

.fn-try-input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}

.fn-try-select {
  cursor: pointer;
}

.fn-try-field-json {
  flex-basis: 100%;
}

.fn-try-json {
  resize: vertical;
  min-height: 2.4em;
  line-height: 1.4;
  white-space: pre;
}

.fn-try-checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--vp-c-brand-1);
}

.fn-try-output {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 6px;
  background: var(--vp-c-brand-soft);
}

.fn-try-output.fn-try-error {
  background: var(--vp-c-danger-soft);
}

.fn-try-output-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--vp-c-brand-1);
  flex-shrink: 0;
}

.fn-try-error .fn-try-output-label {
  color: var(--vp-c-danger-1);
}

.fn-try-output code {
  background: transparent;
  padding: 0;
  color: var(--vp-c-text-1);
  word-break: break-word;
}
</style>
