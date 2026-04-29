import type { Experiment, StudentWork, Comment, Message, FollowRelation } from "./types"

function normalizeGradesToPrimary(grades: Experiment["grades"]): Experiment["grades"] {
  const mapOne = (g: string) => {
    const t = String(g).trim()
    if (t === "一年级" || t === "二年级" || t === "三年级" || t === "四年级" || t === "五年级") return t
    if (t === "小学低年级") return "二年级"
    if (t === "小学高年级") return "四年级"
    // 当前课标口径仅覆盖小学科学：初中/高中文案统一收敛到五年级展示
    if (t === "初一" || t === "初二" || t === "初三") return "五年级"
    if (t === "高一" || t === "高二" || t === "高三") return "五年级"
    return "五年级"
  }
  return (Array.isArray(grades) ? grades : []).map(mapOne) as Experiment["grades"]
}

// 模拟实验数据 - v3
const RAW_MOCK_EXPERIMENTS: Experiment[] = [
  {
    id: "exp-001",
    title: "牛顿摆实验",
    description: "通过牛顿摆动量守恒定律，观察能量在小球之间的传递过程。",
    thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&h=400&fit=crop",
    videoUrl: "https://example.com/video1.mp4",
    duration: "15分钟",
    difficulty: "中等",
    grades: ["初一", "初二", "初三"],
    rating: 4.8,
    ratingCount: 24,
    ratings: [
      {
        id: "rating-001",
        experimentId: "exp-001",
        userId: "student-002",
        userName: "小红",
        userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
        rating: 5,
        comment: "这个实验太有趣了！能量传递的过程看得非常清楚，物理课本上的知识一下子就理解了。",
        createdAt: "2024-01-20T10:30:00Z"
      },
      {
        id: "rating-002",
        experimentId: "exp-001",
        userId: "student-003",
        userName: "小刚",
        userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
        rating: 5,
        comment: "老师讲解得很详细，步骤清晰易懂，非常推荐！",
        createdAt: "2024-01-19T14:20:00Z"
      },
      {
        id: "rating-003",
        experimentId: "exp-001",
        userId: "student-004",
        userName: "小美",
        userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
        rating: 4,
        comment: "实验很好，就是材料准备有点复杂。",
        createdAt: "2024-01-18T09:15:00Z"
      }
    ],
    category: "physics",
    subcategory: "力学",
    createdBy: "teacher-001",
    createdAt: "2024-01-15",
    viewCount: 1250,
    likeCount: 328,
    favoriteCount: 156,
    status: "published",
    teacher: {
      id: "teacher-001",
      name: "李明华",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      title: "高级教师",
      school: "北京市第一中学",
      verified: true
    },
    materials: [
      { name: "牛顿摆套件", quantity: "1套" },
      { name: "秒表", quantity: "1个", optional: true },
      { name: "直尺", quantity: "1把" },
    ],
    steps: [
      {
        order: 1,
        title: "组装牛顿摆",
        description: "按照说明书将牛顿摆的支架和小球组装好，确保每个小球的长度一致。",
        tips: "小球之间要刚好接触，不要有间隙",
      },
      {
        order: 2,
        title: "单球实验",
        description: "拉起最左边的一个小球，松手观察现象。",
        tips: "拉起角度保持在30度左右效果最佳",
      },
      {
        order: 3,
        title: "双球实验",
        description: "同时拉起最左边的两个小球，松手观察现象。",
      },
      {
        order: 4,
        title: "记录数据",
        description: "记录每次实验中小球的摆动次数和摆动幅度变化。",
      },
    ],
    safetyTips: [
      { type: "info", content: "实验过程中保持桌面稳定" },
      { type: "warning", content: "不要用力拉扯小球，避免线断裂" },
    ],
  },
  {
    id: "exp-002",
    title: "火山喷发模拟",
    description: "使用小苏打和醋模拟火山喷发，观察化学反应产生的气泡和熔岩流动。",
    thumbnail: "https://images.unsplash.com/photo-1563207153-f403bf289096?w=600&h=400&fit=crop",
    videoUrl: "https://example.com/video2.mp4",
    duration: "20分钟",
    difficulty: "简单",
    grades: ["小学低年级", "小学高年级"],
    rating: 4.9,
    ratingCount: 56,
    category: "chemistry",
    subcategory: "酸碱反应",
    createdBy: "teacher-001",
    createdAt: "2024-01-10",
    viewCount: 2180,
    likeCount: 567,
    favoriteCount: 289,
    status: "published",
    teacher: {
      id: "teacher-002",
      name: "王晓芳",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
      title: "一级教师",
      school: "上海市实验小学",
      verified: true
    },
    materials: [
      { name: "小苏打", quantity: "50克" },
      { name: "白醋", quantity: "100毫升" },
      { name: "红色食用色素", quantity: "少量" },
      { name: "洗洁精", quantity: "少量" },
      { name: "塑料瓶", quantity: "1个" },
      { name: "黏土或纸板", quantity: "适量" },
    ],
    steps: [
      {
        order: 1,
        title: "制作火山模型",
        description: "用黏土或纸板在塑料瓶周围塑造出火山的形状。",
        tips: "瓶口要露出来，不要被黏土盖住",
      },
      {
        order: 2,
        title: "准备熔岩材料",
        description: "在塑料瓶中加入小苏打、红色食用色素和少量洗洁精。",
      },
      {
        order: 3,
        title: "触发喷发",
        description: "快速倒入白醋，观察火山喷发的壮观景象！",
        tips: "准备好纸巾，喷发会有一些溢出",
      },
    ],
    safetyTips: [
      { type: "info", content: "在通风良好的地方进行实验" },
      { type: "warning", content: "避免醋液溅入眼睛" },
      { type: "info", content: "实验后及时清理桌面" },
    ],
  },
  {
    id: "exp-003",
    title: "植物细胞观察",
    description: "使用显微镜观察洋葱表皮细胞，了解植物细胞的基本结构。",
    thumbnail: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=600&h=400&fit=crop",
    videoUrl: "https://example.com/video3.mp4",
    duration: "30分钟",
    difficulty: "中等",
    grades: ["初一", "初二"],
    rating: 4.7,
    ratingCount: 18,
    category: "biology",
    subcategory: "细胞",
    createdBy: "teacher-001",
    createdAt: "2024-01-08",
    viewCount: 980,
    likeCount: 234,
    favoriteCount: 145,
    status: "pending",
    teacher: {
      id: "teacher-001",
      name: "李明华",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      title: "高级教师",
      school: "北京市第一中学",
      verified: true
    },
    materials: [
      { name: "显微镜", quantity: "1台" },
      { name: "洋葱", quantity: "1个" },
      { name: "载玻片", quantity: "2片" },
      { name: "盖玻片", quantity: "2片" },
      { name: "碘液", quantity: "少量" },
      { name: "镊子", quantity: "1把" },
      { name: "滴管", quantity: "1个" },
    ],
    steps: [
      {
        order: 1,
        title: "制作临时装片",
        description: "用镊子小心撕取洋葱内表皮，平铺在载玻片上。",
        tips: "表皮要尽量平整，避免褶皱",
      },
      {
        order: 2,
        title: "染色处理",
        description: "滴加1-2滴碘液进行染色，静置1分钟。",
      },
      {
        order: 3,
        title: "盖上盖玻片",
        description: "将盖玻片一边先接触载玻片，然后慢慢放下，避免气泡产生。",
        tips: "盖玻片要缓慢放下，呈45度角",
      },
      {
        order: 4,
        title: "显微镜观察",
        description: "从低倍镜开始观察，找到细胞后再换高倍镜仔细观察。",
      },
    ],
    safetyTips: [
      { type: "warning", content: "碘液有腐蚀性，避免接触皮肤" },
      { type: "danger", content: "小心使用镊子，避免划伤" },
      { type: "info", content: "使用显微镜时眼睛不要太靠近目镜" },
    ],
  },
  {
    id: "exp-004",
    title: "彩虹牛奶实验",
    description: "利用表面张力原理，在牛奶中创造出美丽的彩虹漩涡效果。",
    thumbnail: "https://images.unsplash.com/photo-1628689469838-524a4a973b8e?w=600&h=400&fit=crop",
    videoUrl: "https://example.com/video4.mp4",
    duration: "10分钟",
    difficulty: "简单",
    grades: ["小学低年级", "小学高年级"],
    rating: 4.9,
    ratingCount: 89,
    category: "chemistry",
    subcategory: "表面张力",
    createdBy: "teacher-001",
    createdAt: "2024-01-20",
    viewCount: 3420,
    likeCount: 892,
    status: "draft",
    teacher: {
      id: "teacher-003",
      name: "张伟",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      title: "二级教师",
      school: "广州市育才中学",
      verified: false
    },
    favoriteCount: 567,
    materials: [
      { name: "全脂牛奶", quantity: "200毫升" },
      { name: "食用色素（多色）", quantity: "4种颜色" },
      { name: "洗洁精", quantity: "少量" },
      { name: "浅盘", quantity: "1个" },
      { name: "棉签", quantity: "若干" },
    ],
    steps: [
      {
        order: 1,
        title: "倒入牛奶",
        description: "将牛奶倒入浅盘中，深度约1厘米即可。",
        tips: "使用全脂牛奶效果更好",
      },
      {
        order: 2,
        title: "滴加色素",
        description: "在牛奶表面的不同位置滴加不同颜色的食用色素。",
      },
      {
        order: 3,
        title: "触发反应",
        description: "用棉签蘸取少量洗洁精，轻轻点触牛奶表面的色素处。",
        tips: "动作要轻柔，观察颜色的流动",
      },
    ],
    safetyTips: [
      { type: "info", content: "实验用的牛奶不可饮用" },
      { type: "info", content: "食用色素可能会染色，注意保护衣物" },
    ],
  },
  {
    id: "exp-005",
    title: "光的折射实验",
    description: "通过水中筷子弯折现象，探究光在不同介质中的传播规律。",
    thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop",
    videoUrl: "https://example.com/video5.mp4",
    duration: "15分钟",
    difficulty: "简单",
    grades: ["小学高年级", "初一"],
    rating: 4.6,
    ratingCount: 32,
    category: "physics",
    subcategory: "光学",
    createdBy: "teacher-001",
    createdAt: "2024-01-18",
    viewCount: 1560,
    likeCount: 345,
    favoriteCount: 178,
    status: "published",
    teacher: {
      id: "teacher-001",
      name: "李明华",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      title: "高级教师",
      school: "北京市第一中学",
      verified: true
    },
    materials: [
      { name: "透明玻璃杯", quantity: "1个" },
      { name: "筷子", quantity: "1双" },
      { name: "水", quantity: "适量" },
      { name: "激光笔", quantity: "1支", optional: true },
    ],
    steps: [
      {
        order: 1,
        title: "准备实验",
        description: "在透明玻璃杯中倒入约三分之二的清水。",
      },
      {
        order: 2,
        title: "观察现象",
        description: "将筷子斜插入水中，从侧面观察筷子的形状变化。",
        tips: "从不同角度观察会有不同的效果",
      },
      {
        order: 3,
        title: "深入探究",
        description: "改变筷子插入的角度，观察弯折程度的变化。",
      },
    ],
    safetyTips: [
      { type: "warning", content: "如使用激光笔，切勿直射眼睛" },
      { type: "info", content: "小心玻璃杯，避免打碎" },
    ],
  },
  {
    id: "exp-006",
    title: "蚂蚁行为观察",
    description: "观察蚂蚁的觅食行为和信息素通讯方式，了解昆虫的社会性。",
    thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
    videoUrl: "https://example.com/video6.mp4",
    duration: "45分钟",
    difficulty: "中等",
    grades: ["小学高年级", "初一", "初二"],
    rating: 4.5,
    ratingCount: 15,
    category: "biology",
    subcategory: "动物行为",
    createdBy: "teacher-001",
    createdAt: "2024-01-12",
    viewCount: 890,
    likeCount: 198,
    favoriteCount: 123,
    status: "published",
    teacher: {
      id: "teacher-002",
      name: "王晓芳",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
      title: "一级教师",
      school: "上海市实验小学",
      verified: true
    },
    materials: [
      { name: "放大镜", quantity: "1个" },
      { name: "白糖或面包屑", quantity: "少量" },
      { name: "记录本", quantity: "1本" },
      { name: "计时器", quantity: "1个" },
    ],
    steps: [
      {
        order: 1,
        title: "寻找蚂蚁",
        description: "在户外找到蚂蚁的活动区域或蚁穴。",
        tips: "花坛边缘和树根附近容易找到",
      },
      {
        order: 2,
        title: "��置食物",
        description: "在蚂蚁活动路线附近放置少量糖或面包屑。",
      },
      {
        order: 3,
        title: "观察记录",
        description: "记录蚂蚁发现食物的时间、召集同伴的方式、搬运食物的过程。",
      },
      {
        order: 4,
        title: "干扰实验",
        description: "用手指轻轻划过蚂蚁的行进路线，观察它们的反应。",
        tips: "这样可以破坏信息素路径，观察蚂蚁如何重新找路",
      },
    ],
    safetyTips: [
      { type: "info", content: "不要伤害蚂蚁，只做观察" },
      { type: "warning", content: "户外实验注意防蚊虫叮咬" },
      { type: "info", content: "实验后清理食物残渣" },
    ],
  },
]

export const mockExperiments: Experiment[] = RAW_MOCK_EXPERIMENTS.map((e) => ({
  ...e,
  grades: normalizeGradesToPrimary(e.grades),
}))

export const mockStudentWorks: StudentWork[] = [
  {
    id: "work-001",
    experimentId: "exp-002",
    experimentTitle: "火山喷发模拟",
    studentId: "student-002",
    studentName: "张小红",
    studentAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    videoUrl: "https://example.com/student-video1.mp4",
    thumbnail: "https://images.unsplash.com/photo-1563207153-f403bf289096?w=600&h=400&fit=crop",
    description: "我用橙色和红色色素混合，做出了超级逼真的岩浆效果！还加了闪粉让它更漂亮~",
    createdAt: "2024-01-22",
    likeCount: 45,
    favoriteCount: 12,
    commentCount: 8,
    isLiked: false,
    isFavorited: false,
  },
  {
    id: "work-002",
    experimentId: "exp-004",
    experimentTitle: "彩虹牛奶实验",
    studentId: "student-003",
    studentName: "王小华",
    studentAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    videoUrl: "https://example.com/student-video2.mp4",
    thumbnail: "https://images.unsplash.com/photo-1628689469838-524a4a973b8e?w=600&h=400&fit=crop",
    description: "彩虹牛奶太神奇了！我发现用温牛奶颜色扩散得更快更漂亮！",
    createdAt: "2024-01-21",
    likeCount: 67,
    favoriteCount: 23,
    commentCount: 15,
    isLiked: true,
    isFavorited: false,
  },
  {
    id: "work-003",
    experimentId: "exp-001",
    experimentTitle: "牛顿摆实验",
    studentId: "student-004",
    studentName: "刘小强",
    studentAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    videoUrl: "https://example.com/student-video3.mp4",
    thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&h=400&fit=crop",
    description: "我用自己做的牛顿摆完成了实验，用的是弹珠和钓鱼线，效果也很好！",
    createdAt: "2024-01-20",
    likeCount: 38,
    favoriteCount: 9,
    commentCount: 6,
    isLiked: false,
    isFavorited: true,
  },
]

export const mockComments: Comment[] = [
  {
    id: "comment-001",
    workId: "work-001",
    userId: "teacher-001",
    userName: "王老师",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    userRole: "teacher",
    content: "做得非常棒！颜色搭配很有创意，下次可以尝试记录喷发的持续时间哦~",
    createdAt: "2024-01-22",
    likes: 12,
  },
  {
    id: "comment-002",
    workId: "work-001",
    userId: "student-003",
    userName: "王小华",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    userRole: "student",
    content: "闪粉是什么牌子的？我也想试试！",
    createdAt: "2024-01-22",
    likes: 3,
  },
  {
    id: "comment-003",
    workId: "work-002",
    userId: "teacher-001",
    userName: "王老师",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    userRole: "teacher",
    content: "观察得很仔细！温度确实会影响表面张力，你发现了一个很好的科学原理。",
    createdAt: "2024-01-21",
    likes: 18,
  },
]

// 模拟消息数据
export const mockMessages: Message[] = [
  {
    id: "msg-001",
    type: "comment",
    title: "新评论",
    content: "王老师评论了你的作品《神奇的火山喷发》：\"非常精彩的实验，色彩搭配很好看！\"",
    fromUser: {
      id: "teacher-001",
      name: "王老师",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
    },
    relatedId: "work-001",
    relatedTitle: "神奇的火山喷发",
    read: false,
    createdAt: "2024-01-23T10:30:00Z"
  },
  {
    id: "msg-002",
    type: "like",
    title: "收到点赞",
    content: "小红点赞了你的作品《神奇的火山喷发》",
    fromUser: {
      id: "student-002",
      name: "小红",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
    },
    relatedId: "work-001",
    relatedTitle: "神奇的火山喷发",
    read: false,
    createdAt: "2024-01-23T09:15:00Z"
  },
  {
    id: "msg-003",
    type: "rating",
    title: "实验评分",
    content: "小刚给你的实验《牛顿摆实验》打了5星好评：\"老师讲解得很详细！\"",
    fromUser: {
      id: "student-003",
      name: "小刚",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    },
    relatedId: "exp-001",
    relatedTitle: "牛顿摆实验",
    read: true,
    createdAt: "2024-01-22T16:20:00Z"
  },
  {
    id: "msg-004",
    type: "system",
    title: "系统通知",
    content: "恭喜！你的实验《彩虹牛奶》已通过审核，现已发布。",
    relatedId: "exp-004",
    relatedTitle: "彩虹牛奶",
    read: true,
    createdAt: "2024-01-22T14:00:00Z"
  },
  {
    id: "msg-005",
    type: "work",
    title: "新作品提交",
    content: "学生小明提交了《彩虹牛奶》实验的作品，快来查看吧！",
    fromUser: {
      id: "student-001",
      name: "小明",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face"
    },
    relatedId: "work-002",
    relatedTitle: "彩虹牛奶",
    read: false,
    createdAt: "2024-01-21T11:45:00Z"
  },
  {
    id: "msg-006",
    type: "follow",
    title: "新关注",
    content: "小美关注了你",
    fromUser: {
      id: "student-004",
      name: "小美",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
    },
    read: true,
    createdAt: "2024-01-20T08:30:00Z"
  },
]

// 模拟关注关系数据
export const mockFollowRelations: FollowRelation[] = [
  {
    id: "follow-001",
    followerId: "student-001",
    followingId: "teacher-001",
    createdAt: "2024-01-15T10:00:00Z"
  },
  {
    id: "follow-002",
    followerId: "student-001",
    followingId: "student-002",
    createdAt: "2024-01-16T14:30:00Z"
  },
]
