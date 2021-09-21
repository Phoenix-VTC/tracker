<template>
  <div class="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
    <div class="md:grid md:grid-cols-3 md:gap-6">
      <div class="md:col-span-1">
        <h3 class="text-lg font-medium leading-6 text-gray-900">{{ title }}</h3>
        <p class="mt-1 text-sm text-gray-500">
          {{ description }}
        </p>
      </div>
      <div class="mt-5 md:mt-0 md:col-span-2">
        <div class="space-y-6">
          <div class="grid grid-cols-3 gap-6">
            <slot></slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "SettingsSection",

  props: {
    title: String,
    description: String
  },
}
</script>

<style scoped>

</style>
