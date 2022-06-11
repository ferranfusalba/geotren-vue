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
  <h4>Martorell Central</h4>
  <table>
    <div
      v-for="(item, index) in this.$store.state.trains.records"
      :key="(item, index)"
    >
      <div
        v-if="
          this.$store.state.trains.records[index].fields.desti == 'PE' &&
          this.$store.state.trains.records[
            index
          ].fields.properes_parades.search('QC') != -1
        "
      >
        <tr>
          <td>{{ this.$store.state.trains.records[index].fields.lin }}</td>
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
              this.$store.state.trains.records[index].fields
                .properes_parades[12] +
              this.$store.state.trains.records[index].fields
                .properes_parades[13]
            }}
          </td>
          <td>{{ this.$store.state.trains.records[index].fields.en_hora }}</td>
        </tr>
      </div>
    </div>
  </table>
  <h4>Quatre Camins</h4>
  <table>
    <div
      v-for="(item, index) in this.$store.state.trains.records"
      :key="(item, index)"
    >
      <div
        v-if="
          this.$store.state.trains.records[index].fields.origen == 'PE' &&
          this.$store.state.trains.records[
            index
          ].fields.properes_parades.search('QC') != -1
        "
      >
        <tr>
          <td>{{ this.$store.state.trains.records[index].fields.lin }}</td>
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
              this.$store.state.trains.records[index].fields
                .properes_parades[12] +
              this.$store.state.trains.records[index].fields
                .properes_parades[13]
            }}
          </td>
          <td v-if="this.$store.state.trains.records[index].fields.en_hora == 'True'">A l'hora</td>
          <td v-else-if="this.$store.state.trains.records[index].fields.en_hora != 'True'">{{this.$store.state.trains.records[index].fields.en_hora}}</td>
        </tr>
      </div>
    </div>
  </table>
</template>

<script>
export default {
  name: "Panel",
  data() {
    return {
      text: "",
      station: "",
    };
  },
  mounted() {
    this.$store.dispatch("getTrains");
    // this.filterQC(this.$store.state.trains.records);
    // console.log(this.$store.state.trains.records[0].fields.properes_parades);
  },
  updated() {
    // console.log(this.$store.state.trains.records);
    this.filterQC(this.$store.state.trains.records);
    this.filterNextStation(this.$store.state.trains.records);
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
    filterNextStation(value) {
      console.log("filterNextStation");
      for (let i = 0; i < value.length; i++) {
        // if (value[i].fields.origen == "PE") {
          // if (value[i].fields.properes_parades.search("QC") != -1) {
            this.station =
              value[i].fields.properes_parades[12] +
              value[i].fields.properes_parades[13];
            switch (this.station) {
              case "PE":
                this.text = "Pl. Espanya";
                break;
              case "MG":
                this.text = "Magòria-La Campana";
                break;
              case "IC":
                this.text = "Ildefons Cerdà";
                break;
              case "EU":
                this.text = "Europa | Fira";
                break;
              case "GO":
                this.text = "Gornal";
                break;
              case "SP":
                this.text = "Sant Josep";
                break;
              case "LH":
                this.text = "L'Hospitalet Av. Carrilet";
                break;
              case "AL":
                this.text = "Almeda";
                break;
              case "CO":
                this.text = "Cornellà Riera";
                break;
              case "BO":
                this.text = "Sant Boi";
                break;
              case "ML":
                this.text = "Molí Nou | Ciutat Cooperativa";
                break;
              case "CG":
                this.text = "Colònia Güell";
                break;
              case "CL":
                this.text = "Santa Coloma de Cervelló";
                break;
              case "VH":
                this.text = "Sant Vicenç dels Horts";
                break;
              case "CR":
                this.text = "Can Ros";
                break;
              case "QC":
                this.text = "Quatre Camins";
                break;
              case "PA":
                this.text = "Pallejà";
                break;
              case "SA":
                this.text = "Sant Andreu de la Barca";
                break;
              case "PL":
                this.text = "El Palau";
                break;
              case "MV":
                this.text = "Martorell Vila | Castellbisbal";
                break;
              case "MC":
                this.text = "Martorell Central";
                break;
            }
          }
        //}
      //}
    },
  },
};
</script>
