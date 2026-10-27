# Aşçı Defteri: Analiz ve Kapsamlı Geliştirme Planı

50 yaşındaki, teknolojiden uzak ve kağıt-kalem alışkanlığı olan seyyar aşçılarımız için tasarlanan Aşçı Defteri'nin mevcut durum analizi ve yeni mimari geliştirme planı.

---

## Proje Analizi (Mevcut Durum ve İhtiyaçlar)

### 1. Kullanıcı Profili (50 Yaşındaki Seyyar Aşçı)
- **Kullanım Şartları**: Açık hava, dumanlı kazan başları, gürültülü pazar yerleri ve unlu/ıslak eller.
- **Beklenti**:
  - Küçük menülere girmeden alt bardan tek dokunuşla istediği yere geçebilme.
  - Markete/hale girdiğinde doğrudan "Alışveriş" sekmesine basıp işi seçerek tik atabilme.
  - Sadece düğün bazlı değil, günlük genel aşçılık masraflarını (tüp gazı, nakliye/mazot, kazan kalayı, bıçak masrafı) yazabileceği "Esnaf Kasa Defteri".

### 2. Mevcut Yapıdaki Eksiklikler
- Şu an alışveriş ve cari takip iş detayının derinliklerinde yer alıyor; ustanın markete gittiğinde 3 kez tıklaması gerekiyor.
- Cari hesap sadece tekil işlerle sınırlı; aşçının dükkan/iş harici genel mesleki giderleri (mazot, tüp, malzeme ziyanı) genel bilançoya yansımıyor.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Planlanan yeni mimarideki 3 temel sütun:

1. **Alt Bar (Thumb-Zone Navigasyon)**:
   - **1. İş Defteri**: Düğün ve merasimlerin kronolojik listesi ve 4 adımlı yeni iş sihirbazı.
   - **2. Pazar / Alışveriş**: Aşçı markete gittiğinde doğrudan açılan, listeden işi seçip tek ekranda tik atıp fiyat girebildiği ve ev sahibine WhatsApp atabildiği özel modül.
   - **3. Genel Cari Defter (Kasa)**: Hem düğünlerden gelen tahsilatların hem de genel esnaf giderlerinin (mazot, tüp, tamirat vb.) tek defterde alt alta aktığı genel bakiye defteri.
2. **Genel Gider / Gelir Sistemi**:
   - İşe bağlı olmayan genel mesleki harcamalar (`+ Genel Gider Ekle`: Mazot, Tüp, Bıçak/Kazan) ve genel gelirler tek tıkla girilebilir.
   - "Kasamdaki Net Para" ve "Bekleyen Toplam Alacaklarım" dev puntolarla gösterilir.
3. **50 Yaş Ergonomisi & Sıfır Karmaşa**:
   - En az 56px buton yükseklikleri, 18px-24px okunaklı yazılar, ferah beyaz zemin (`#F8FAFC`) ve derin lacivert kontrast (`#0F172A`).
   - Sıfır mock veri, %100 yerel hafıza (LocalStorage), sıfır şifre/giriş.

---

## 1. Yeni Mimari ve Ekran Yapısı

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Aşçı Defteri Ana Ekran                          │
│                      (Tek Dokunuş, Sıfır Karmaşa)                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    ▼                               ▼                               ▼
┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
│     1. İŞ DEFTERİ     │   │  2. PAZAR / ALIŞVERİŞ │   │ 3. GENEL CARİ DEFTER  │
│  - Aktif / Tamamlanan │   │  - İşi Seç (Açılır)   │   │  - Kasamdaki Net Para │
│  - İş Künyesi & Fiyat │   │  - Malzeme [✓] Tik At │   │  - Bekleyen Alacaklar │
│  - [ ➕ Yeni İş Ekle ] │   │  - Gerçek Fiyat Gir ₺ │   │  - İş Tahsilatları    │
│  - İş Detay & Kapatma │   │  - WhatsApp Gönder    │   │  - Genel Gider/Gelir  │
└───────────────────────┘   └───────────────────────┘   └───────────────────────┘
    ▲                               ▲                               ▲
    └───────────────────────────────┴───────────────────────────────┘
           [ SABİT ALT BAR: 1. İşler | 2. Alışveriş | 3. Cari Defter ]
```

---

## 2. Modül Detayları ve Kullanıcı Deneyimi

### Modül 1: İş Defteri (Düğünler ve Hayır Yemekleri)
- Aktif ve tamamlanan işlerin kocaman kartları.
- Kart üzerinde: Ev Sahibi Adı, Tarih, Kişi Sayısı, Kalan Alacak.
- Kocaman `[ ➕ Yeni İş Ekle ]` butonu (Götürü veya Kişi Başı fiyat seçeneğiyle).

### Modül 2: Pazar & Alışveriş Ekranı (Doğrudan Menüden Erişim)
- Usta markete veya toptancıya girdiğinde alt bardan tek tıkla **"Alışveriş"** sekmesine basar.
- **İş Seçici**: Üstte büyük bir seçici ile hangi işin alışverişini yapacağını seçer (Örn: `[ ▾ Mehmet Ağa Düğünü - 12 Kasım ]`).
- **Pazar Listesi**:
  - Her malzemenin yanında dev dokunmatik onay kutusu `[✓]` (sepete attıkça yeşil olur).
  - Malzemenin karşısında büyük `[ Fiyat ₺ ]` kutusu.
  - Alışveriş yapıldıkça üstteki bar anlık güncellenir: *"Pazarda Harcanan: 18.500 ₺ (5/8 Alındı)"*.
  - Altta tek tıkla `[ 🟢 WhatsApp ile Ev Sahibine Gönder ]` butonu.
  - `[ ➕ Yeni Malzeme Ekle ]` alanı.

### Modül 3: Genel Cari Defter (Kasa ve Bütün Gelir / Giderler)
- Sadece işlerle sınırlı kalmayan, ustanın cebindeki gerçek parayı gösteren esnaf defteri.
- **Büyük Kasa Panosu**:
  - **Kasamdaki Net Para**: Toplam Tahsilatlar + Diğer Gelirler - (Pazar Masrafları + Ekip Yevmiyeleri + Genel Giderler).
  - **Bekleyen Toplam Alacak**: Düğün sahiplerinden henüz tahsil edilmemiş bakiye.
- **Hızlı İşlem Butonları**:
  - `[ ➕ Genel Gider Yaz ]` (Örn: 450 ₺ Tüp Dolumu, 1.200 ₺ Mazot, 800 ₺ Bıçak Bileme / Malzeme).
  - `[ ➕ Düğün Tahsilatı Ekle ]` (İşi seçip alınan parayı düşme).
- **Zaman Çizelgesi / Defter Görünümü**:
  - Tarih sırasıyla tüm hareketler tek bir ekranda akar (Örn: `+10.000 ₺ Kapora (Mehmet Ağa Düğünü)`, `-600 ₺ Sanayi Tüp Gazı`, `-1.500 ₺ Çırak Ahmet Yevmiye`).

---

## 3. Güncellenecek Veri Modeli (`lib/cook-storage.ts`)

```ts
// Genel Gider / Gelir Modeli
interface GeneralTransaction {
  id: string;
  type: 'expense' | 'income';       // Gider mi gelir mi?
  category: 'tup' | 'mazot' | 'tamir' | 'ekip' | 'diger'; // Kategori
  title: string;                    // Açıklama (Örn: "2 Adet Sanayi Tüpü")
  amount: number;                   // Tutar (₺)
  date: string;                     // Tarih (YYYY-MM-DD)
  jobId?: string;                   // İsteğe bağlı bir işe bağlı olabilir
}

// Genişletilmiş App State
interface CookNotebookState {
  jobs: CookJob[];
  generalTransactions: GeneralTransaction[];
}
```

---

## 4. Uygulama Adımları (Geliştirme Sırası)

1. **Veri Modeli Genişletmesi (`lib/cook-storage.ts`)**:
   - `GeneralTransaction` modelinin ve depolama fonksiyonlarının eklenmesi.
   - Genel kasa, toplam gelir, toplam gider ve net cep kârı hesaplama fonksiyonları.
2. **3 Sekmeli Alt Barın Kurulması (`components/bottom-nav.tsx`)**:
   - `1. İş Defteri`, `2. Alışveriş`, `3. Cari Defter`.
   - 56px dokunma hit-box'ı, büyük ikonlar ve net Türkçe etiketler.
3. **Müstakil Pazar / Alışveriş Ekranı (`components/shopping-screen.tsx`)**:
   - Aktif iş seçici açılır menüsü.
   - İşe ait malzeme checklist'i, gerçek fiyat girişleri, anlık toplam masraf ve WhatsApp paylaşımı.
4. **Genel Cari Defter Ekranı (`components/ledger-screen.tsx`)**:
   - Kasadaki net nakit ve bekleyen alacak özet panosu.
   - Genel gider ekleme modalı (Tüp, Mazot, Tamir vb.).
   - Kronolojik gelir/gider hareket defteri.
5. **Ana Sayfa (`app/page.tsx`) Entegrasyonu**:
   - 3 sekme arasında akıcı geçiş ve anlık LocalStorage senkronizasyonu.
6. **Doğrulama & Test**:
   - `lint_applet` ve `compile_applet` ile sıfır hata doğrulaması.
