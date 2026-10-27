# İkili Mod Mimarisi ve Basit Aşçı Defteri Uygulama Planı

Aşçı Defteri'ne ilk girişte sorulan ve tercihi hatırlayan **İkili Mod Seçim Ekranı** (Basit Mod / Gelişmiş Mod) eklenmesi; teknolojiyle arası olmayan 50 yaşındaki bir usta aşçının tek elle en hızlı şekilde kullanabileceği, tamamen bağımsız **Basit Mod** modüllerinin (Düğün Listesi/Takvim, Fotoğraflı & Parmakla Çizilebilir Alışveriş Listesi, WhatsApp Paylaşımı, Mini Bakiye Takibi) geliştirilmesi.

## Kullanıcı Onayı ve Kritik Kararlar

> [!IMPORTANT]
> Kullanıcı ile soru-cevap sürecinde netleştirilen ana kararlar:
> 1. **Mod Değişimi**: Kullanıcı dilediğinde ekranın sağ üst köşesindeki belirgin bir buton ile Basit Mod ve Gelişmiş Mod arasında anında geçiş yapabilecek.
> 2. **Veri İzolasyonu**: Basit Mod ve Gelişmiş Mod tamamen bağımsız iki ayrı defter (farklı localStorage anahtarları: `asci_simple_db` ve `asci_defteri_v2`) olarak çalışacak, birbirlerinin kayıtlarını karıştırmayacak.
> 3. **Alışveriş Listesi Çizimi**: Aşçı kağıt listenin fotoğrafını çekip/yükledikten sonra doğrudan dokunmatik ekranda parmağıyla (HTML5 Canvas üzerinde kırmızı marker ile) aldıklarının üzerini çizebilecek ve bu çizilmiş hali WhatsApp üzerinden tek tıkla paylaşabilecek.

---

## 1. Genel Bakış ve Temel Konsept

* **Ne İşe Yarayacak?**:
  * **İlk Açılış Ekranı (Mod Seçici)**: Uygulamayı ilk kez açan aşçıya devasa, okunabilir iki kart/buton sunulur:
    * `🟢 Basit Mod (Usta Defteri)`: "Sadece düğünlerim, kağıt liste fotoğrafları ve kimden ne para aldım/verdim takibi."
    * `⚡ Gelişmiş Mod`: "Detaylı reçeteler, gramaj hesapları, tam kasa defteri ve ayrıntılı analizler."
  * **Seçim Kalıcılığı**: Seçilen tercih `cook_app_mode` anahtarında saklanır; web sitesinde ve PWA'da sonraki tüm açılışlarda doğrudan bu mod açılır.
  * **Basit Mod Yetenekleri**:
    1. **Sade Düğün Listesi & Takvim**: Kronolojik kartlar veya basit gün kutucukları. Düğüne tıkla; tarih, kişi sayısı ve notu gör/düzenle.
    2. **Fotoğraflı Alışveriş Listesi & Çizim (Scratchpad)**: Telefonun kamerasından kağıt listenin fotoğrafını çek veya galeriden seç. Ekranda parmağınla aldıklarının üstünü kırmızıyla çiz. İşin bitince WhatsApp ile ev sahibine veya çırağa görseli/notu fırlat.
    3. **Basit Bakiye Takibi**:
       * *Müşteri / Düğün Sahibi*: Anlaşılan ücret ne kadar? Ne kadar peşinat alındı? Kalan ne kadar?
       * *Ekip / Yevmiyeci*: Kime ne ödendi, kime ne kadar borç kaldı?

---

## 2. Kullanıcı Deneyimi ve Görsel Tasarım

### A. İlk Giriş Mod Seçim Ekranı (Welcome Screen)
* Tamamen sade, göz yormayan, telefonun ekranını dikeyde iki eşit alana bölen iki büyük buton:
  * Üst Buton: **🟢 BASİT MOD (KOLAY DEFTER)**
    * Alt yazı: *"50 Yaş Üstü Ustalar İçin: Sadece Düğünler, Fotoğraflı Liste, Hızlı Kasa"*
  * Alt Buton: **⚡ GELİŞMİŞ MOD (DETAYLI TAKİP)**
    * Alt yazı: *"Menü reçeteleri, porsiyon gramajı, malzeme alışveriş listesi ve tam cari defter"*
* Tercih kaydedildiği anda seçilen moda geçilir.

### B. Basit Mod Arayüzü (3 Sekmeli Sade Tasarım)
* Üst Çubuk (Header):
  * Sol: **Aşçı Defteri (Kolay Mod)**
  * Sağ: **[ ⚡ Gelişmiş Moda Geç ]** (Büyük, net kontrastlı geçiş butonu)
* Alt Bar (3 Sekme, Kocaman İkon ve Yazılar):
  1. **📅 Düğünler**: Basit liste ve aylık takvim düğmesi (Dolu günler kırmızı, boş günler yeşil).
  2. **🛒 Alışveriş (Foto)**: Kağıt listenin fotoğrafı, üzerine parmakla dokunup kırmızı kalemle çizme, WhatsApp butonu.
  3. **💰 Para Hesabı**: "Düğün Sahibinden Kalan", "Ekibe Verilecek Yevmiyeler".

---

## 3. Ürün Kararları ve Mimari Ayrım

| Karar | Seçilen Yaklaşım | Gerekçe |
| :--- | :--- | :--- |
| **Mod Ayrımı** | URL Query (`?mode=simple` veya `?mode=advanced`) + `localStorage` kalıcı tercihi | Hem tarayıcıda hem PWA yüklendiğinde hafızada kalır; doğrudan yönlendirme sıfır gecikmeyle çalışır. |
| **Fotoğraf Çizimi** | HTML5 Canvas + Touch Event API | Harici ağır kütüphanelere gerek kalmadan mobil dokunmatik ekranda 60 FPS pürüzsüz parmak çizimi sağlar. |
| **WhatsApp Entegrasyonu** | `whatsapp://send` / `https://wa.me` ve Web Share API (`navigator.share`) | Çizilen liste görüntüsü dosya olarak paylaşılır ya da WhatsApp üzerinden doğrudan müşteriye/ekibe aktarılır. |
| **Veri Güvenliği** | `asci_simple_db` ve `asci_defteri_v2` ayrımı | Kullanıcının isteği doğrultusunda veriler tamamen bağımsız tutulur, birbirine karışmaz. |

---

## 4. Teknik Mimari ve Veri Akışı

```
┌──────────────────────────────────────────────────────────────┐
│                    İlk Giriş Mod Seçimi                     │
│        (cook_app_mode: 'simple' | 'advanced' | null)        │
└──────────────┬───────────────────────────────┬───────────────┘
               │                               │
       'simple'│                       'advanced'
               ▼                               ▼
┌───────────────────────────────┐ ┌────────────────────────────┐
│          BASİT MOD            │ │       GELİŞMİŞ MOD         │
│  (lib/simple-cook-storage.ts) │ │   (lib/cook-storage.ts)    │
├───────────────────────────────┤ ├────────────────────────────┤
│ • Düğünler & Takvim           │ │ • Menü Planlama & Reçeteler│
│ • Fotoğraflı Alışveriş Çizimi │ │ • Otomatik Malzeme Hesabı  │
│ • WhatsApp Paylaşımı          │ │ • Çoklu Alışveriş Listesi  │
│ • Mini Müşteri/Ekip Bakiyesi  │ │ • Detaylı Cari Kasa        │
│ ───────────────────────────── │ │ ────────────────────────── │
│ [⚡ Gelişmiş Moda Geç Butonu] │ │ [🟢 Kolay Moda Geç Butonu] │
└───────────────────────────────┘ └────────────────────────────┘
```

### Basit Mod Veri Modeli (`lib/simple-cook-storage.ts`)
* `SimpleWedding`: `id`, `title`, `date`, `guestCount`, `phone`, `notes`, `agreedAmount`, `receivedDeposit`, `isCompleted`.
* `SimpleShoppingPhoto`: `id`, `weddingId`, `weddingTitle`, `photoDataUrl`, `annotatedDataUrl`, `notes`, `updatedAt`.
* `SimpleLaborPay`: `id`, `weddingId`, `workerName`, `agreedWage`, `paidAmount`, `notes`.
