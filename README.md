# Misir-M-KDS
Mısır Yaprağı Hastalıklarının Tespiti ve Mücadelesi için Derin Öğrenme Tabanlı, Çevrimdışı Çalışabilen Mobil Karar Destek Sistemi



**TÜBİTAK 2209-A Üniversite Öğrencileri Araştırma Projeleri Destekleme Programı (2025 - 1. Dönem) Başvurusu**

---

**Proje Yürütücüsü:** Caner CEYHAN
**Akademik Danışman:** Öğr. Gör. Dr. Fatma Neda TOPUZ
**Kurum:** Osmaniye Korkut Ata Üniversitesi Mühendislik ve Doğa Bilimleri Fakültesi

**Proje Durumu:** `Başvuru Aşamasında`

---

## 1. Projenin Amacı

Bu projenin ana amacı, mısır tarımında ciddi verim kayıplarına neden olan yaygın yaprak hastalıklarının (örn: Gri Leke, Pas), çiftçiler tarafından sahada, **internet bağlantısı olmadan (çevrimdışı)** tespit edilmesini sağlayan bir mobil karar destek sistemi (M-KDS) geliştirmektir.

Proje, literatürdeki "tespit-ötesi eylem eksikliği" boşluğunu doldurmayı hedefleyerek, yapay zekâ teşhisini (Hastalık Tespiti), danışman uzmanlığına dayalı bir "Uzman Sistem" (Kültürel ve kimyasal sınıf önerileri) ile birleştirecektir.

## 2. Kullanılacak Teknolojiler 

Projenin metodolojisine dayanan temel teknolojiler:

* **Yapay Zekâ Modeli:** ResNet50 (Transfer Learning)
* **Model Eğitimi:** Python, TensorFlow/Keras, Google Colab Pro (GPU)
* **Mobil Optimizasyon:** TensorFlow Lite (TFLite) (Çevrimdışı çıkarım için)
* **Mobil Uygulama:** React Native (iOS & Android)
* **Öneri Mekanizması:** JSON Tabanlı Uzman Sistem (Deterministik Kural Tabanlı)

## 3. Proje İş Paketleri (Yol Haritası)

Proje, 12 aylık takvime uygun olarak 4 temel İş Paketi (İP) altında yürütülecektir:

* **İP 1 (11/2025 - 01/2026):** Veri Seti Hazırlığı, Kapsamlı Literatür Analizi ve Sistem Tasarımı
* **İP 2 (02/2026 - 04/2026):** DCNN Modelinin Eğitimi (Colab Pro) ve TFLite Optimizasyonu
* **İP 3 (05/2026 - 07/2026):** Mobil Uygulama Geliştirme (React Native) ve Uzman Sistem Entegrasyonu
* **İP 4 (08/2026 - 10/2026):** Saha Testleri, Kullanıcı Geri Bildirimleri, İyileştirme ve Nihai Raporlama

## 4. Depo (Repository) Yapısı

Bu depo, projenin geliştirme sürecindeki tüm çıktıları ve dokümanları barındırmak için yapılandırılmıştır:
