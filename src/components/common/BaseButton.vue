<template>
    <button :class="['base-button', variant]" :style="customStyle" @click="$emit('click', $event)">
        <slot />
    </button>
</template>

<script setup lang="ts">
interface Props {
    variant?: 'default' | 'danger' | 'success'   // 按钮类型，可扩展
    customStyle?: Record<string, string>        // 支持内联样式覆盖
}

const props = defineProps<Props>()
</script>

<style scoped>
.base-button {
    background-color: #555;
    color: white;
    padding: 7px 10px;
    border: none;
    cursor: pointer;
    opacity: 0.8;
    width: 120px;
    margin-right: 8px;
    margin-bottom: 5px;
    transition: opacity 0.2s;
}

.base-button:hover {
    opacity: 1;
}

.base-button.danger {
    background-color: #ff5b49;
}

.base-button.success {
    background-color: #4CAF50;
}
</style>
