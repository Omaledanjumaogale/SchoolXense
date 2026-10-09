<script lang="ts">
 import {FAQ} from '$lib/faq';import PageTemplate from '$lib/components/PageTemplate.svelte';import FAQSection from '$lib/components/FAQSection.svelte';
</script>
<PageTemplate title="Frequently asked questions" intro="SchoolXense offers free and paid learning features. Verified accounts, active subscriptions and guardian safeguards determine access; each E-WIN platform enforces its own conditions." links={[{title:'Compare plans',url:'/pricing'},{title:'Safety and guardians',url:'/safety'}]}><FAQSection items={FAQ}/></PageTemplate>