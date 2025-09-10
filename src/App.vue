<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <div class="wrapper">
      <nav>
        <RouterLink to="/">topology</RouterLink>
        <RouterLink to="/cytoscape">cytoscape</RouterLink>
        <!-- <RouterLink to="/topology">topology</RouterLink> -->
        <RouterLink to="/graphml">graphml</RouterLink>
        <RouterLink to="/playground">playground</RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
  border-bottom: 1px solid black;
  /* background-color: antiquewhite; */
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 0;
}

nav a.router-link-exact-active {
  color: #e98017da;
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  padding-bottom: 2px;
  text-decoration: none;
}

/* 导航链接 */
nav a {
  text-decoration: none;
  margin-right: 20px;
  font-weight: bold;
  transition: color 0.3s;
}

/* 当前页面高亮 */
nav a:active {
  color: red;
}

/* 鼠标悬停效果 */
nav a:hover {
  color: #e98017da;
}



@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
    flex-direction: column;
    width: 100%;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;
    padding: 0rem 0;
    margin-top: 0rem;
  }
}
</style>
