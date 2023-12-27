<template>
  <vue-countdown :time="time" v-slot="{ hours, minutes, seconds }">
    {{ hours < 10 ? '0' + hours : hours }}:{{ minutes < 10 ? '0' + minutes : minutes }}:{{
      seconds < 10 ? '0' + seconds : seconds
    }}
  </vue-countdown>
</template>

<script lang="ts">
import VueCountdown from '@chenfengyuan/vue-countdown'

export default {
  props: {
    departure_time: String
  },
  components: {
    VueCountdown
  },
  data() {
    const now: Date = new Date()
    const departure_hour: string = this.departure_time?.[0] + '' + this.departure_time?.[1]
    const departure_minute: string = this.departure_time?.[3] + '' + this.departure_time?.[4]
    const departure_second: string = this.departure_time?.[6] + '' + this.departure_time?.[7]
    const left: number = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      Number(departure_hour),
      Number(departure_minute),
      Number(departure_second)
    ).valueOf()

    return {
      time: left - now.valueOf()
    }
  }
}
</script>
