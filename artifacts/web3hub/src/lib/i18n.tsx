import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type LangCode =
  | "zh-CN" | "zh-TW" | "en" | "ja" | "ko" | "hi"
  | "fr" | "es" | "it" | "vi" | "ru" | "ar";

type Dict = Record<string, string>;

const TRANSLATIONS: Record<LangCode, Dict> = {
  "zh-CN": {
    home: "首页", profile: "个人资料", connect: "连接钱包", disconnect: "退出登录",
    apply: "申请创建空间", search: "搜索项目、需求或 KOL...", pinned: "置顶专区",
    regular: "普通项目区", view: "查看", new: "新",
    checkin: "签到 +1000积分", points: "积分", energy: "剩余能量",
    pinCount: "置顶次数", inviteCode: "邀请码", wallet: "钱包地址",
    space: "空间用户", social: "社交链接", language: "语言设置",
    save: "保存", saving: "保存中...", saved: "✓ 已保存", cancel: "取消",
    myProfile: "我的资料", myPosts: "我的帖子", noPost: "您还没有发布任何帖子",
    checkinBtn: "每日签到", nextCheckin: "下次签到：", canCheckin: "✓ 今日可签到",
    spaceNo: "否", spaceYes: "是 ✓", spacePending: "审核中", spaceRejected: "未通过",
    spaceBanned: "失去资格", applySpace: "申请创建空间 →",
    donate: "如果喜欢我们，欢迎打赏", contact: "所有合作联系支持",
    invited: "已邀", people: "人", tagline: "Web3 项目方一站式需求发布与匹配平台",
    register: "+ 注册项目", noLatest: "暂无动态",
    encouragement: "成为 Web3Hub 首批项目方，立即发布需求，让全网开发者与投资者第一时间看到你！",
    total: "共", projects: "个项目",
  },
  "zh-TW": {
    home: "首頁", profile: "個人資料", connect: "連接錢包", disconnect: "退出登錄",
    apply: "申請創建空間", search: "搜尋項目、需求或 KOL...", pinned: "置頂專區",
    regular: "普通項目區", view: "查看", new: "新",
    checkin: "簽到 +1000積分", points: "積分", energy: "剩餘能量",
    pinCount: "置頂次數", inviteCode: "邀請碼", wallet: "錢包地址",
    space: "空間用戶", social: "社交連結", language: "語言設定",
    save: "儲存", saving: "儲存中...", saved: "✓ 已儲存", cancel: "取消",
    myProfile: "我的資料", myPosts: "我的帖子", noPost: "您還沒有發布任何帖子",
    checkinBtn: "每日簽到", nextCheckin: "下次簽到：", canCheckin: "✓ 今日可簽到",
    spaceNo: "否", spaceYes: "是 ✓", spacePending: "審核中", spaceRejected: "未通過",
    spaceBanned: "失去資格", applySpace: "申請創建空間 →",
    donate: "如果喜歡我們，歡迎打賞", contact: "所有合作聯繫支持",
    invited: "已邀", people: "人", tagline: "Web3 項目方一站式需求發布與匹配平台",
    register: "+ 註冊項目", noLatest: "暫無動態",
    encouragement: "成為 Web3Hub 首批項目方，立即發布需求，讓全網開發者與投資者第一時間看到你！",
    total: "共", projects: "個項目",
  },
  "en": {
    home: "Home", profile: "Profile", connect: "Connect Wallet", disconnect: "Disconnect",
    apply: "Apply for Space", search: "Search projects, needs or KOL...", pinned: "Pinned Zone",
    regular: "Projects Zone", view: "View", new: "New",
    checkin: "Check-in +1000 pts", points: "Points", energy: "Energy",
    pinCount: "Pin Count", inviteCode: "Invite Code", wallet: "Wallet Address",
    space: "Space User", social: "Social Links", language: "Language",
    save: "Save", saving: "Saving...", saved: "✓ Saved", cancel: "Cancel",
    myProfile: "My Profile", myPosts: "My Posts", noPost: "You have not published any posts yet",
    checkinBtn: "Daily Check-in", nextCheckin: "Next check-in:", canCheckin: "✓ Check-in available",
    spaceNo: "No", spaceYes: "Yes ✓", spacePending: "Pending", spaceRejected: "Rejected",
    spaceBanned: "Banned", applySpace: "Apply for Space →",
    donate: "If you like us, feel free to donate", contact: "All partnership & support",
    invited: "Invited", people: "users", tagline: "One-stop Web3 project demand & matching platform",
    register: "+ Register Project", noLatest: "No updates yet",
    encouragement: "Be the first Web3 project on Web3Hub — publish your needs now and get seen by developers & investors worldwide!",
    total: "Total", projects: "projects",
  },
  "ja": {
    home: "ホーム", profile: "プロフィール", connect: "ウォレット接続", disconnect: "切断",
    apply: "スペース申請", search: "プロジェクト・KOLを検索...", pinned: "固定ゾーン",
    regular: "プロジェクトゾーン", view: "表示", new: "新着",
    checkin: "チェックイン +1000pt", points: "ポイント", energy: "エネルギー",
    pinCount: "固定回数", inviteCode: "招待コード", wallet: "ウォレットアドレス",
    space: "スペースユーザー", social: "ソーシャルリンク", language: "言語設定",
    save: "保存", saving: "保存中...", saved: "✓ 保存済み", cancel: "キャンセル",
    myProfile: "マイプロフィール", myPosts: "マイ投稿", noPost: "まだ投稿がありません",
    checkinBtn: "デイリーチェックイン", nextCheckin: "次回チェックイン：", canCheckin: "✓ チェックイン可能",
    spaceNo: "なし", spaceYes: "あり ✓", spacePending: "審査中", spaceRejected: "不承認",
    spaceBanned: "資格停止", applySpace: "スペース申請 →",
    donate: "気に入ったら、ぜひ投げ銭を", contact: "提携・サポート",
    invited: "招待済み", people: "人", tagline: "Web3プロジェクト一元管理プラットフォーム",
    register: "+ プロジェクト登録", noLatest: "更新なし",
    encouragement: "Web3Hubの最初のプロジェクトになりましょう！",
    total: "合計", projects: "プロジェクト",
  },
  "ko": {
    home: "홈", profile: "프로필", connect: "지갑 연결", disconnect: "연결 해제",
    apply: "스페이스 신청", search: "프로젝트, KOL 검색...", pinned: "핀 구역",
    regular: "프로젝트 구역", view: "보기", new: "신규",
    checkin: "체크인 +1000pt", points: "포인트", energy: "에너지",
    pinCount: "핀 횟수", inviteCode: "초대 코드", wallet: "지갑 주소",
    space: "스페이스 유저", social: "소셜 링크", language: "언어 설정",
    save: "저장", saving: "저장 중...", saved: "✓ 저장됨", cancel: "취소",
    myProfile: "내 프로필", myPosts: "내 게시물", noPost: "아직 게시물이 없습니다",
    checkinBtn: "데일리 체크인", nextCheckin: "다음 체크인：", canCheckin: "✓ 체크인 가능",
    spaceNo: "없음", spaceYes: "있음 ✓", spacePending: "심사 중", spaceRejected: "거부됨",
    spaceBanned: "자격 박탈", applySpace: "스페이스 신청 →",
    donate: "마음에 드셨다면 후원해주세요", contact: "파트너십 및 지원",
    invited: "초대한", people: "명", tagline: "Web3 프로젝트 원스톱 매칭 플랫폼",
    register: "+ 프로젝트 등록", noLatest: "업데이트 없음",
    encouragement: "Web3Hub의 첫 번째 프로젝트가 되어보세요!",
    total: "총", projects: "개 프로젝트",
  },
  "hi": {
    home: "होम", profile: "प्रोफ़ाइल", connect: "वॉलेट जोड़ें", disconnect: "डिस्कनेक्ट",
    apply: "स्पेस के लिए आवेदन", search: "प्रोजेक्ट या KOL खोजें...", pinned: "पिन ज़ोन",
    regular: "प्रोजेक्ट ज़ोन", view: "देखें", new: "नया",
    checkin: "चेक-इन +1000 pts", points: "पॉइंट्स", energy: "एनर्जी",
    pinCount: "पिन काउंट", inviteCode: "आमंत्रण कोड", wallet: "वॉलेट पता",
    space: "स्पेस यूज़र", social: "सोशल लिंक", language: "भाषा",
    save: "सहेजें", saving: "सहेज रहे हैं...", saved: "✓ सहेजा", cancel: "रद्द करें",
    myProfile: "मेरी प्रोफ़ाइल", myPosts: "मेरी पोस्ट", noPost: "अभी तक कोई पोस्ट नहीं",
    checkinBtn: "डेली चेक-इन", nextCheckin: "अगला चेक-इन:", canCheckin: "✓ चेक-इन उपलब्ध",
    spaceNo: "नहीं", spaceYes: "हाँ ✓", spacePending: "समीक्षाधीन", spaceRejected: "अस्वीकृत",
    spaceBanned: "प्रतिबंधित", applySpace: "स्पेस के लिए आवेदन →",
    donate: "अगर आपको पसंद आया, तो दान करें", contact: "सभी साझेदारी और समर्थन",
    invited: "आमंत्रित", people: "लोग", tagline: "Web3 प्रोजेक्ट वन-स्टॉप प्लेटफ़ॉर्म",
    register: "+ प्रोजेक्ट रजिस्टर", noLatest: "कोई अपडेट नहीं",
    encouragement: "Web3Hub पर पहले प्रोजेक्ट बनें!",
    total: "कुल", projects: "प्रोजेक्ट",
  },
  "fr": {
    home: "Accueil", profile: "Profil", connect: "Connecter Wallet", disconnect: "Déconnecter",
    apply: "Postuler espace", search: "Rechercher projets, KOL...", pinned: "Zone épinglée",
    regular: "Zone projets", view: "Voir", new: "Nouveau",
    checkin: "Connexion +1000 pts", points: "Points", energy: "Énergie",
    pinCount: "Épinglages", inviteCode: "Code invitation", wallet: "Adresse wallet",
    space: "Espace utilisateur", social: "Liens sociaux", language: "Langue",
    save: "Enregistrer", saving: "Enregistrement...", saved: "✓ Enregistré", cancel: "Annuler",
    myProfile: "Mon profil", myPosts: "Mes posts", noPost: "Aucun post publié",
    checkinBtn: "Connexion quotidienne", nextCheckin: "Prochaine connexion :", canCheckin: "✓ Connexion disponible",
    spaceNo: "Non", spaceYes: "Oui ✓", spacePending: "En attente", spaceRejected: "Refusé",
    spaceBanned: "Banni", applySpace: "Postuler espace →",
    donate: "Si vous aimez, n'hésitez pas à faire un don", contact: "Partenariats & support",
    invited: "Invités", people: "utilisateurs", tagline: "Plateforme Web3 tout-en-un",
    register: "+ Enregistrer projet", noLatest: "Aucune mise à jour",
    encouragement: "Soyez le premier projet sur Web3Hub !",
    total: "Total", projects: "projets",
  },
  "es": {
    home: "Inicio", profile: "Perfil", connect: "Conectar Wallet", disconnect: "Desconectar",
    apply: "Solicitar espacio", search: "Buscar proyectos, KOL...", pinned: "Zona fijada",
    regular: "Zona proyectos", view: "Ver", new: "Nuevo",
    checkin: "Check-in +1000 pts", points: "Puntos", energy: "Energía",
    pinCount: "Fijaciones", inviteCode: "Código invitación", wallet: "Dirección wallet",
    space: "Espacio usuario", social: "Redes sociales", language: "Idioma",
    save: "Guardar", saving: "Guardando...", saved: "✓ Guardado", cancel: "Cancelar",
    myProfile: "Mi perfil", myPosts: "Mis posts", noPost: "Aún no has publicado nada",
    checkinBtn: "Check-in diario", nextCheckin: "Próximo check-in:", canCheckin: "✓ Check-in disponible",
    spaceNo: "No", spaceYes: "Sí ✓", spacePending: "Pendiente", spaceRejected: "Rechazado",
    spaceBanned: "Prohibido", applySpace: "Solicitar espacio →",
    donate: "Si te gusta, no dudes en donar", contact: "Colaboraciones y soporte",
    invited: "Invitados", people: "usuarios", tagline: "Plataforma todo-en-uno Web3",
    register: "+ Registrar proyecto", noLatest: "Sin actualizaciones",
    encouragement: "¡Sé el primer proyecto en Web3Hub!",
    total: "Total", projects: "proyectos",
  },
  "it": {
    home: "Home", profile: "Profilo", connect: "Connetti Wallet", disconnect: "Disconnetti",
    apply: "Richiedi spazio", search: "Cerca progetti, KOL...", pinned: "Zona in evidenza",
    regular: "Zona progetti", view: "Visualizza", new: "Nuovo",
    checkin: "Check-in +1000 pts", points: "Punti", energy: "Energia",
    pinCount: "Fissaggi", inviteCode: "Codice invito", wallet: "Indirizzo wallet",
    space: "Utente spazio", social: "Link social", language: "Lingua",
    save: "Salva", saving: "Salvataggio...", saved: "✓ Salvato", cancel: "Annulla",
    myProfile: "Il mio profilo", myPosts: "I miei post", noPost: "Nessun post pubblicato",
    checkinBtn: "Check-in giornaliero", nextCheckin: "Prossimo check-in:", canCheckin: "✓ Check-in disponibile",
    spaceNo: "No", spaceYes: "Sì ✓", spacePending: "In attesa", spaceRejected: "Rifiutato",
    spaceBanned: "Bannato", applySpace: "Richiedi spazio →",
    donate: "Se ti piace, sentiti libero di donare", contact: "Partnership e supporto",
    invited: "Invitati", people: "utenti", tagline: "Piattaforma Web3 tutto-in-uno",
    register: "+ Registra progetto", noLatest: "Nessun aggiornamento",
    encouragement: "Sii il primo progetto su Web3Hub!",
    total: "Totale", projects: "progetti",
  },
  "vi": {
    home: "Trang chủ", profile: "Hồ sơ", connect: "Kết nối Ví", disconnect: "Ngắt kết nối",
    apply: "Đăng ký không gian", search: "Tìm kiếm dự án, KOL...", pinned: "Vùng ghim",
    regular: "Vùng dự án", view: "Xem", new: "Mới",
    checkin: "Điểm danh +1000 điểm", points: "Điểm", energy: "Năng lượng",
    pinCount: "Lần ghim", inviteCode: "Mã mời", wallet: "Địa chỉ ví",
    space: "Người dùng không gian", social: "Liên kết mạng xã hội", language: "Ngôn ngữ",
    save: "Lưu", saving: "Đang lưu...", saved: "✓ Đã lưu", cancel: "Hủy",
    myProfile: "Hồ sơ của tôi", myPosts: "Bài viết của tôi", noPost: "Chưa có bài viết nào",
    checkinBtn: "Điểm danh hàng ngày", nextCheckin: "Điểm danh tiếp theo:", canCheckin: "✓ Có thể điểm danh",
    spaceNo: "Không", spaceYes: "Có ✓", spacePending: "Đang xét", spaceRejected: "Bị từ chối",
    spaceBanned: "Bị cấm", applySpace: "Đăng ký không gian →",
    donate: "Nếu bạn thích, hãy ủng hộ chúng tôi", contact: "Hợp tác & hỗ trợ",
    invited: "Đã mời", people: "người", tagline: "Nền tảng Web3 một cửa",
    register: "+ Đăng ký dự án", noLatest: "Chưa có cập nhật",
    encouragement: "Hãy là dự án đầu tiên trên Web3Hub!",
    total: "Tổng", projects: "dự án",
  },
  "ru": {
    home: "Главная", profile: "Профиль", connect: "Подключить кошелёк", disconnect: "Отключить",
    apply: "Подать заявку", search: "Поиск проектов, KOL...", pinned: "Закреплённая зона",
    regular: "Зона проектов", view: "Просмотр", new: "Новый",
    checkin: "Чекин +1000 очков", points: "Очки", energy: "Энергия",
    pinCount: "Закреплений", inviteCode: "Инвайт-код", wallet: "Адрес кошелька",
    space: "Пользователь пространства", social: "Соцссылки", language: "Язык",
    save: "Сохранить", saving: "Сохранение...", saved: "✓ Сохранено", cancel: "Отмена",
    myProfile: "Мой профиль", myPosts: "Мои посты", noPost: "Вы ещё ничего не публиковали",
    checkinBtn: "Ежедневный чекин", nextCheckin: "Следующий чекин:", canCheckin: "✓ Чекин доступен",
    spaceNo: "Нет", spaceYes: "Да ✓", spacePending: "На рассмотрении", spaceRejected: "Отклонено",
    spaceBanned: "Заблокировано", applySpace: "Подать заявку →",
    donate: "Если вам нравится, поддержите нас", contact: "Партнёрство и поддержка",
    invited: "Приглашено", people: "чел.", tagline: "Универсальная Web3-платформа",
    register: "+ Зарегистрировать проект", noLatest: "Нет обновлений",
    encouragement: "Будьте первым проектом на Web3Hub!",
    total: "Всего", projects: "проектов",
  },
  "ar": {
    home: "الرئيسية", profile: "الملف الشخصي", connect: "ربط المحفظة", disconnect: "فصل",
    apply: "التقدم للمساحة", search: "بحث عن مشاريع، KOL...", pinned: "منطقة المثبَّت",
    regular: "منطقة المشاريع", view: "عرض", new: "جديد",
    checkin: "تسجيل الحضور +1000 نقطة", points: "نقاط", energy: "طاقة",
    pinCount: "عدد التثبيت", inviteCode: "رمز الدعوة", wallet: "عنوان المحفظة",
    space: "مستخدم المساحة", social: "روابط التواصل", language: "اللغة",
    save: "حفظ", saving: "جاري الحفظ...", saved: "✓ تم الحفظ", cancel: "إلغاء",
    myProfile: "ملفي الشخصي", myPosts: "منشوراتي", noPost: "لم تنشر أي شيء بعد",
    checkinBtn: "تسجيل الحضور اليومي", nextCheckin: "الحضور التالي:", canCheckin: "✓ التسجيل متاح",
    spaceNo: "لا", spaceYes: "نعم ✓", spacePending: "قيد المراجعة", spaceRejected: "مرفوض",
    spaceBanned: "محظور", applySpace: "التقدم للمساحة →",
    donate: "إذا أعجبك، فلا تتردد في التبرع", contact: "الشراكات والدعم",
    invited: "مدعو", people: "مستخدم", tagline: "منصة Web3 الشاملة",
    register: "+ تسجيل مشروع", noLatest: "لا تحديثات",
    encouragement: "كن أول مشروع على Web3Hub!",
    total: "الإجمالي", projects: "مشاريع",
  },
};

const getBrowserLang = (): LangCode => {
  const nav = navigator.language || "en";
  if (nav.startsWith("zh-TW") || nav.startsWith("zh-HK")) return "zh-TW";
  if (nav.startsWith("zh")) return "zh-CN";
  if (nav.startsWith("ja")) return "ja";
  if (nav.startsWith("ko")) return "ko";
  if (nav.startsWith("hi")) return "hi";
  if (nav.startsWith("fr")) return "fr";
  if (nav.startsWith("es")) return "es";
  if (nav.startsWith("it")) return "it";
  if (nav.startsWith("vi")) return "vi";
  if (nav.startsWith("ru")) return "ru";
  if (nav.startsWith("ar")) return "ar";
  return "en";
};

interface LangContextType {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: (key: string) => string;
}

const LangContext = createContext<LangContextType>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<LangCode>(() => {
    const stored = localStorage.getItem("web3hub_lang") as LangCode | null;
    return stored || getBrowserLang();
  });

  const t = (key: string) => {
    return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS["en"][key] ?? key;
  };

  const handleSetLang = (l: LangCode) => {
    setLang(l);
    localStorage.setItem("web3hub_lang", l);
  };

  return (
    <LangContext.Provider value={{ lang, setLang: handleSetLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
