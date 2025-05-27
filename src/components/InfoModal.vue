<template>
<div class="modal is-active" ref="modal">
  <div class="modal-background"></div>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">Selamat Datang</p>
    </header>
    <section class="modal-card-body">
      Pada fase ini, Anda akan diminta untuk membanding dua 3D model interaktif: <b>Fotogrametry</b> (atas) dan <b>3D Gaussian Splatting</b> (bawah). 
      <div class="mt-3"></div>
      <ul>
        <li>1) Anda akan memulai dengan melihat model dari berbagai sudut pandang. </li>
        <li>2) Anda dapat mengubah posisi kamera dengan mengklik tombol di sebelah kiri.</li>
        <li>3) Setiap kamera memiliki nama dan keterangan, harap dibaca.</li>
        <li>4) Setelah semua kamera dilihat, form kuisioner akan muncul di sebelah kanan.</li>
      </ul>
    </section>
    <footer class="modal-card-foot">
      <div class="buttons">
        <button class="button is-success" @click="closeModal()">Mulai</button>
      </div>
    </footer>
  </div>
</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'; 

const modal = ref<HTMLDivElement | null>(null);


const closeModal = () => {
  if (modal.value) {
    modal.value.classList.remove('is-active');
  }
};
</script>