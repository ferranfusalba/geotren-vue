<template>
  <h1>Panel</h1>
  <!-- <div
    v-for="(item, index) in this.$store.state.trains.records"
    :key="(item, index)"
  >
    <table>
      <tr>
        <td>{{ this.$store.state.trains.records[index].fields.lin }}</td>
        <td>{{ this.$store.state.trains.records[index].fields.desti }}</td>
        <td>
          {{ this.$store.state.trains.records[index].fields.tipus_unitat }}
        </td>
        <td>
          {{ this.$store.state.trains.records[index].fields.properes_parades }}
        </td>
        <td>{{ this.$store.state.trains.records[index].fields.en_hora }}</td>
      </tr>
    </table>
  </div>
  <hr /> -->
  <table>
    <tr>
      <th>Línia</th>
      <!-- <th>Destí</th> -->
      <th>UT</th>
      <th>Estacionat</th>
      <th>Prop</th>
      <th>Estat</th>
    </tr>
  </table>
  <div
    v-for="(item, index) in this.$store.state.trains.records"
    :key="(item, index)"
  >
    <div
      v-if="
        this.$store.state.trains.records[index].fields.origen == 'PE' &&
        this.$store.state.trains.records[index].fields.properes_parades.search(
          'QC'
        ) != -1
      "
    >
      <table>
        <tr>
          <td>{{ this.$store.state.trains.records[index].fields.lin }}</td>
          <!-- <td>{{ this.$store.state.trains.records[index].fields.desti }}</td> -->
          <td>
            {{ this.$store.state.trains.records[index].fields.tipus_unitat }}
          </td>
          <td
            v-if="this.$store.state.trains.records[index].fields.estacionat_a"
          >
            {{ this.$store.state.trains.records[index].fields.estacionat_a }}
          </td>
          <td
            v-else-if="
              this.$store.state.trains.records[index].fields.estacionat_a ==
              null
            "
          >
            ec
          </td>
          <td>
            {{
              this.$store.state.trains.records[index].fields.properes_parades
            }}
          </td>
          <td>{{ this.$store.state.trains.records[index].fields.en_hora }}</td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: "Panel",
  mounted() {
    this.$store.dispatch("getTrains");
    // this.filterQC(this.$store.state.trains.records);
    // console.log(this.$store.state.trains.records[0].fields.properes_parades);
  },
  updated() {
    // console.log(this.$store.state.trains.records);
    this.filterQC(this.$store.state.trains.records);
  },
  methods: {
    filterQC(value) {
      console.log("filterQC");
      for (let i = 0; i < value.length; i++) {
        if (value[i].fields.origen == "PE") {
          if (value[i].fields.properes_parades.search("QC") != -1) {
            console.log("success");
            return true;
          }
        }
      }
    },
  },
};
</script>
