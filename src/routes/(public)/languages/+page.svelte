<script lang="ts">
  import { locales } from '#lib/locales';
</script>

<svelte:head>
  <title>Learning languages | SchoolXense</title>
  <meta name="description" content="Choose a language for the SchoolXense learning guide." />
  <link rel="canonical" href="https://schoolxense.ewinproject.org/languages" />
</svelte:head>

<section class="mx-auto max-w-4xl px-5 py-12">
  <h1 class="text-3xl font-bold">Choose a language</h1>
  <p class="mt-3">Read the SchoolXense guide to exam practice and learning resources in your preferred language.</p>
  <ul class="mt-6 grid gap-3 sm:grid-cols-2">
    {#each Object.entries(locales) as [code, copy]}
      <li><a class="link inline-flex min-h-11 items-center" href={'/languages/' + code} lang={code}>{copy.language}</a></li>
    {/each}
  </ul>
  <a class="link mt-6 inline-block" href="/">Back to SchoolXense</a>
</section>
