<template>
  <div class="container">
    <div class="tabs">
      <input type="radio" id="radio-1" name="tabs" checked />
      <label class="tab" for="radio-1">Map</label>
      <input type="radio" id="radio-2" name="tabs" />
      <label class="tab" for="radio-2">MC</label>
      <input type="radio" id="radio-3" name="tabs" />
      <label class="tab" for="radio-3">QC</label>
      <input type="radio" id="radio-4" name="tabs" />
      <label class="tab" for="radio-4">PE</label>
      <span class="selected"></span>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
.container {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-corporative-primary);
  max-width: 480px;
  margin: 0 auto;
}

.tabs {
  display: flex;
  position: relative;
  background-color: #fff;
  box-shadow: 0 0 1px 0 rgba(#185ee0, 0.15), 0 6px 12px 0 rgba(#185ee0, 0.15);
  padding: 0.75rem;
  border-radius: 100px;
  * {
    z-index: 2;
  }
}

input[type='radio'] {
  display: none;
}

.tab {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 54px;
  width: 150px;
  font-size: 1.25rem;
  font-weight: 500;
  border-radius: 100px;
  cursor: pointer;
  transition: color 0.15s ease-in;
  color: var(--color-corporative-secondary);
}

input[type='radio'] {
  &:checked {
    & + label {
      color: var(--color-white);
    }
  }
}

input[id='radio-1'] {
  &:checked {
    & ~ .selected {
      transform: translateX(0);
    }
  }
}

input[id='radio-2'] {
  &:checked {
    & ~ .selected {
      transform: translateX(100%);
    }
  }
}

input[id='radio-3'] {
  &:checked {
    & ~ .selected {
      transform: translateX(200%);
    }
  }
}

input[id='radio-4'] {
  &:checked {
    & ~ .selected {
      transform: translateX(300%);
    }
  }
}

.selected {
  position: absolute;
  display: flex;
  height: 54px;
  width: 150px;
  background-color: var(--color-corporative-secondary);
  z-index: 1;
  border-radius: 100px;
  transition: 0.25s ease-out;
}

@media (max-width: 700px) {
  .tabs {
    transform: scale(0.6);
  }
}
</style>
