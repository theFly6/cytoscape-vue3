<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <div class="wrapper" v-show="false">
      <nav>
        <RouterLink to="/">index</RouterLink>
        <RouterLink to="/topology">topology</RouterLink>
        <RouterLink to="/cytoscape">cytoscape</RouterLink>
        <RouterLink to="/graphml">graphml</RouterLink>
        <RouterLink to="/playground">playground</RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
</template>
