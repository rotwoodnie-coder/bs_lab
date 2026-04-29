import type { AIExperimentSuggestion } from "./types"

function normalizeGradesToPrimary(grades: AIExperimentSuggestion["grades"]): AIExperimentSuggestion["grades"] {
  const mapOne = (g: string) => {
    const t = String(g).trim()
    if (t === "一年级" || t === "二年级" || t === "三年级" || t === "四年级" || t === "五年级") return t
    if (t === "小学低年级") return "二年级"
    if (t === "小学高年级") return "四年级"
    // 现阶段课标仅覆盖小学科学：初中/高中模板统一收敛到五年级展示
    if (t === "初一" || t === "初二" || t === "初三") return "五年级"
    if (t === "高一" || t === "高二" || t === "高三") return "五年级"
    return "五年级"
  }
  return (Array.isArray(grades) ? grades : []).map(mapOne) as AIExperimentSuggestion["grades"]
}

// 30个预设实验模板，用于模拟AI生成功能
const RAW_TEMPLATES: AIExperimentSuggestion[] = [
  // 物理实验 - 10个
  {
    title: "彩虹光谱分解实验",
    description: "利用三棱镜将白光分解成七色光谱，探索光的色散原理。学生将观察到白光是由多种颜色的光混合而成，理解牛顿发现的光学基本定律。",
    category: "physics",
    subcategory: "光学",
    difficulty: "简单",
    grades: ["四年级", "五年级"],
    duration: "20分钟",
    materials: [
      { name: "三棱镜", quantity: "1个" },
      { name: "手电筒或阳光", quantity: "1个" },
      { name: "白纸", quantity: "2张" },
      { name: "黑色卡纸", quantity: "1张" },
    ],
    steps: [
      { order: 1, title: "准备实验环境", description: "选择一个较暗的房间，或者用黑色卡纸遮挡部分光线。" },
      { order: 2, title: "设置光源", description: "打开手电筒，让光束穿过一个小孔照射到三棱镜上。" },
      { order: 3, title: "观察光谱", description: "调整三棱镜角度，在白纸上观察分解后的彩虹光谱。" },
      { order: 4, title: "记录观察", description: "按照红橙黄绿蓝靛紫的顺序记录各色光的位置。" },
    ],
    safetyTips: [
      { type: "info", content: "不要直视强光源，保护眼睛" },
      { type: "warning", content: "三棱镜易碎，轻拿轻放" },
    ],
  },
  {
    title: "磁力线可视化实验",
    description: "使用铁屑观察磁铁周围的磁力线分布，直观理解磁场的形状和方向，是学习电磁学的基础实验。",
    category: "physics",
    subcategory: "磁学",
    difficulty: "简单",
    grades: ["四年级", "五年级"],
    duration: "15分钟",
    materials: [
      { name: "条形磁铁", quantity: "2块" },
      { name: "铁屑", quantity: "50克" },
      { name: "白纸", quantity: "3张" },
      { name: "塑料盒盖", quantity: "1个" },
    ],
    steps: [
      { order: 1, title: "放置磁铁", description: "将条形磁铁放在桌面上，上方覆盖一张白纸。" },
      { order: 2, title: "撒铁屑", description: "均匀撒上铁屑，轻轻敲击纸面，观察铁屑排列。" },
      { order: 3, title: "记录磁力线", description: "用铅笔描绘出磁力线的形状。" },
      { order: 4, title: "双磁铁实验", description: "用两块磁铁做同极相斥、异极相吸的实验。" },
    ],
    safetyTips: [
      { type: "info", content: "铁屑不要接触眼睛和皮肤" },
      { type: "warning", content: "强磁铁可能夹伤手指" },
    ],
  },
  {
    title: "简易电路与灯泡实验",
    description: "通过搭建简单电路点亮小灯泡，理解电路的基本组成和电流的概念，培养动手能力和科学思维。",
    category: "physics",
    subcategory: "电学",
    difficulty: "中等",
    grades: ["五年级"],
    duration: "25分钟",
    materials: [
      { name: "干电池", quantity: "2节" },
      { name: "小灯泡", quantity: "2个" },
      { name: "导线", quantity: "4根" },
      { name: "开关", quantity: "1个" },
      { name: "电池盒", quantity: "1个" },
    ],
    steps: [
      { order: 1, title: "认识元件", description: "了解电池、灯泡、导线、开关的作用。" },
      { order: 2, title: "搭建串联电路", description: "将电池、开关、灯泡用导线依次连接。" },
      { order: 3, title: "测试电路", description: "闭合开关，观察灯泡是否发光。" },
      { order: 4, title: "搭建并联电路", description: "尝试并联连接两个灯泡，比较亮度差异。" },
    ],
    safetyTips: [
      { type: "warning", content: "不要短路电池，会发热" },
      { type: "info", content: "灯泡工作时会发热，不要触摸" },
    ],
  },
  {
    title: "声音传播实验",
    description: "通过不同介质探索声音的传播特性，理解声音需要介质传播的原理，比较固体、液体、气体传声效果。",
    category: "physics",
    subcategory: "声学",
    difficulty: "简单",
    grades: ["四年级", "五年级"],
    duration: "20分钟",
    materials: [
      { name: "音叉", quantity: "1个" },
      { name: "水槽", quantity: "1个" },
      { name: "木棒", quantity: "1根" },
      { name: "塑料管", quantity: "1根" },
    ],
    steps: [
      { order: 1, title: "空气传声", description: "敲击音叉，直接听声音的响度。" },
      { order: 2, title: "固体传声", description: "将音叉放在桌面上，耳朵贴近桌面听声音。" },
      { order: 3, title: "液体传声", description: "将音叉浸入水中，观察水面波纹和声音变化。" },
      { order: 4, title: "比较记录", description: "记录不同介质传声的响度和清晰度。" },
    ],
    safetyTips: [
      { type: "info", content: "不要将耳朵紧贴振动的音叉" },
    ],
  },
  {
    title: "杠杆原理实验",
    description: "探索杠杆的力学原理，通过实验验证杠杆平衡条件，理解省力杠杆和费力杠杆的应用。",
    category: "physics",
    subcategory: "力学",
    difficulty: "中等",
    grades: ["初一", "初二", "初三"],
    duration: "30分钟",
    materials: [
      { name: "杠杆尺", quantity: "1把" },
      { name: "钩码", quantity: "10个" },
      { name: "支架", quantity: "1个" },
      { name: "细绳", quantity: "若干" },
    ],
    steps: [
      { order: 1, title: "安装杠杆", description: "将杠杆尺架在支架上，调节至水平平衡。" },
      { order: 2, title: "单侧挂重", description: "在一侧挂上钩码，观察杠杆倾斜。" },
      { order: 3, title: "平衡实验", description: "在另一侧不同位置挂钩码，找到平衡点。" },
      { order: 4, title: "验证公式", description: "记录数据，验证力x力臂=阻力x阻力臂。" },
    ],
    safetyTips: [
      { type: "info", content: "注意钩码掉落，保护脚部" },
    ],
  },
  {
    title: "浮力与密度实验",
    description: "探索物体在不同液体中的浮沉现象，理解浮力与密度的关系，验证阿基米德原理。",
    category: "physics",
    subcategory: "力学",
    difficulty: "中等",
    grades: ["初二", "初三"],
    duration: "25分钟",
    materials: [
      { name: "鸡蛋", quantity: "2个" },
      { name: "食盐", quantity: "100克" },
      { name: "玻璃杯", quantity: "3个" },
      { name: "清水", quantity: "适量" },
      { name: "搅拌棒", quantity: "1根" },
    ],
    steps: [
      { order: 1, title: "清水实验", description: "将鸡蛋放入清水中，观察下沉现象。" },
      { order: 2, title: "加盐调节", description: "逐渐加入食盐并搅拌，观察鸡蛋上浮。" },
      { order: 3, title: "悬浮状态", description: "调节盐水浓度，使鸡蛋悬浮在水中。" },
      { order: 4, title: "分析原理", description: "讨论密度变化与浮力的关系。" },
    ],
    safetyTips: [
      { type: "info", content: "盐水不要入眼" },
    ],
  },
  {
    title: "热传导实验",
    description: "比较不同材料的导热性能，理解热传导的原理和影响因素，认识生活中的导热和隔热材料。",
    category: "physics",
    subcategory: "热学",
    difficulty: "中等",
    grades: ["初一", "初二"],
    duration: "20分钟",
    materials: [
      { name: "金属勺", quantity: "1把" },
      { name: "塑料勺", quantity: "1把" },
      { name: "木筷子", quantity: "1双" },
      { name: "黄油或蜡", quantity: "少量" },
      { name: "热水杯", quantity: "1个" },
    ],
    steps: [
      { order: 1, title: "准备材料", description: "在每种材料末端粘上相同大小的黄油块。" },
      { order: 2, title: "同时加热", description: "将三种材料同时插入热水中。" },
      { order: 3, title: "观察记录", description: "记录黄油融化的先后顺序和时间。" },
      { order: 4, title: "得出结论", description: "比较不同材料的导热性能差异。" },
    ],
    safetyTips: [
      { type: "warning", content: "小心热水烫伤" },
      { type: "info", content: "金属勺会很快变热，小心触摸" },
    ],
  },
  {
    title: "小孔成像实验",
    description: "制作简易小孔成像装置，观察倒立的实像，理解光沿直线传播的原理和成像规律。",
    category: "physics",
    subcategory: "光学",
    difficulty: "简单",
    grades: ["四年级", "五年级"],
    duration: "25分钟",
    materials: [
      { name: "纸盒", quantity: "1个" },
      { name: "半透明纸", quantity: "1张" },
      { name: "黑色胶带", quantity: "1卷" },
      { name: "针", quantity: "1根" },
      { name: "蜡烛", quantity: "1支" },
    ],
    steps: [
      { order: 1, title: "制作暗箱", description: "用黑色胶带将纸盒内部贴黑，一端开小孔。" },
      { order: 2, title: "安装屏幕", description: "在另一端贴上半透明纸作为成像屏。" },
      { order: 3, title: "点燃蜡烛", description: "在暗室中点燃蜡烛，放在小孔前方。" },
      { order: 4, title: "观察成像", description: "从屏幕一侧观察蜡烛的倒立像。" },
    ],
    safetyTips: [
      { type: "warning", content: "注意蜡烛火焰，防止烧伤" },
      { type: "danger", content: "实验需在成人监护下进行" },
    ],
  },
  {
    title: "静电感应实验",
    description: "通过摩擦起电和静电感应现象，理解电荷的性质和相互作用，探索静电的产生和应用。",
    category: "physics",
    subcategory: "电学",
    difficulty: "简单",
    grades: ["小学高年级", "初一", "初二"],
    duration: "15分钟",
    materials: [
      { name: "气球", quantity: "2个" },
      { name: "塑料尺", quantity: "1把" },
      { name: "碎纸屑", quantity: "少量" },
      { name: "毛皮或毛衣", quantity: "1件" },
    ],
    steps: [
      { order: 1, title: "摩擦起电", description: "用毛皮摩擦气球或塑料尺约30秒。" },
      { order: 2, title: "吸引纸屑", description: "将起电物体靠近碎纸屑，观察吸附现象。" },
      { order: 3, title: "气球互斥", description: "将两个起电气球靠近，观察排斥现象。" },
      { order: 4, title: "贴墙实验", description: "将起电气球贴在墙上，观察吸附持续时间。" },
    ],
    safetyTips: [
      { type: "info", content: "干燥天气效果更明显" },
    ],
  },
  {
    title: "弹簧测力计实验",
    description: "学习使用弹簧测力计测量力的大小，理解胡克定律，掌握正确的测量方法和读数技巧。",
    category: "physics",
    subcategory: "力学",
    difficulty: "简单",
    grades: ["初一", "初二"],
    duration: "20分钟",
    materials: [
      { name: "弹簧测力计", quantity: "1个" },
      { name: "钩码", quantity: "5个" },
      { name: "各种小物体", quantity: "若干" },
      { name: "记录本", quantity: "1本" },
    ],
    steps: [
      { order: 1, title: "检查校零", description: "确认弹簧测力计指针指向零刻度。" },
      { order: 2, title: "测量钩码", description: "逐个挂上钩码，记录读数。" },
      { order: 3, title: "测量物体", description: "测量各种小物体的重力。" },
      { order: 4, title: "数据分析", description: "分析测量数据，验证胡克定律。" },
    ],
    safetyTips: [
      { type: "warning", content: "不要超过测力计的量程" },
    ],
  },

  // 化学实验 - 10个
  {
    title: "变色墨水实验",
    description: "使用酸碱指示剂制作变色墨水，探索酸碱反应的奥秘，理解pH值和指示剂变色原理。",
    category: "chemistry",
    subcategory: "酸碱盐",
    difficulty: "简单",
    grades: ["小学高年级", "初一", "初二"],
    duration: "20分钟",
    materials: [
      { name: "紫甘蓝", quantity: "100克" },
      { name: "热水", quantity: "500毫升" },
      { name: "白醋", quantity: "50毫升" },
      { name: "小苏打水", quantity: "50毫升" },
      { name: "透明杯", quantity: "5个" },
    ],
    steps: [
      { order: 1, title: "制作指示剂", description: "将紫甘蓝切碎，用热水浸泡20分钟，过滤取汁。" },
      { order: 2, title: "测试酸性", description: "向一杯甘蓝汁中加入白醋，观察颜色变化。" },
      { order: 3, title: "测试碱性", description: "向另一杯中加入小苏打水，观察颜色变化。" },
      { order: 4, title: "制作彩虹", description: "用不同酸碱度的溶液制作彩虹色系。" },
    ],
    safetyTips: [
      { type: "info", content: "甘蓝汁会染色衣物，穿旧衣服实验" },
    ],
  },
  {
    title: "制作晶体实验",
    description: "通过饱和溶液结晶法制作漂亮的晶体，理解溶解度、饱和溶液和结晶的概念。",
    category: "chemistry",
    subcategory: "物质变化",
    difficulty: "中等",
    grades: ["五年级"],
    duration: "持续3-5天",
    materials: [
      { name: "食盐或明矾", quantity: "200克" },
      { name: "热水", quantity: "500毫升" },
      { name: "玻璃杯", quantity: "2个" },
      { name: "棉线", quantity: "1根" },
      { name: "铅笔", quantity: "1支" },
    ],
    steps: [
      { order: 1, title: "制作饱和溶液", description: "在热水中不断加入盐或明矾直到无法溶解。" },
      { order: 2, title: "准备晶核", description: "将棉线绑在铅笔上，悬挂在杯中。" },
      { order: 3, title: "静置等待", description: "将杯子放在阴凉处，每天观察晶体生长。" },
      { order: 4, title: "收获晶体", description: "3-5天后取出，欣赏你的晶体作品。" },
    ],
    safetyTips: [
      { type: "warning", content: "热水小心烫伤" },
      { type: "info", content: "明矾不可食用" },
    ],
  },
  {
    title: "大象牙膏实验",
    description: "通过分解过氧化氢产生大量泡沫，观察催化剂加速化学反应的效果，理解酶的催化作用。",
    category: "chemistry",
    subcategory: "物质变化",
    difficulty: "中等",
    grades: ["初二", "初三"],
    duration: "15分钟",
    materials: [
      { name: "过氧化氢溶液(12%)", quantity: "100毫升" },
      { name: "干酵母", quantity: "1包" },
      { name: "温水", quantity: "50毫升" },
      { name: "洗洁精", quantity: "少量" },
      { name: "食用色素", quantity: "少量" },
      { name: "塑料瓶", quantity: "1个" },
    ],
    steps: [
      { order: 1, title: "调配酵母", description: "将干酵母溶解在温水中，静置5分钟激活。" },
      { order: 2, title: "准备底液", description: "在塑料瓶中倒入过氧化氢、洗洁精和色素。" },
      { order: 3, title: "触发反应", description: "快速倒入酵母溶液，观察泡沫喷涌而出。" },
      { order: 4, title: "分析原理", description: "讨论酵母中的过氧化氢酶如何加速分解。" },
    ],
    safetyTips: [
      { type: "danger", content: "过氧化氢有腐蚀性，戴手套和护目镜" },
      { type: "warning", content: "反应会放热，不要触摸泡沫" },
    ],
  },
  {
    title: "牛奶塑料实验",
    description: "用牛奶和醋制作天然塑料，了解蛋白质变性和酪蛋白的性质，探索可降解材料。",
    category: "chemistry",
    subcategory: "有机化学",
    difficulty: "简单",
    grades: ["小学高年级", "初一"],
    duration: "30分钟",
    materials: [
      { name: "全脂牛奶", quantity: "250毫升" },
      { name: "白醋", quantity: "50毫升" },
      { name: "锅", quantity: "1个" },
      { name: "纱布", quantity: "1块" },
      { name: "模具", quantity: "若干" },
    ],
    steps: [
      { order: 1, title: "加热牛奶", description: "将牛奶加热至微微冒泡（不要沸腾）。" },
      { order: 2, title: "加入醋", description: "关火后加入白醋，搅拌观察凝固。" },
      { order: 3, title: "过滤成型", description: "用纱布过滤，挤干水分，放入模具定型。" },
      { order: 4, title: "干燥成品", description: "晾干1-2天，得到硬化的牛奶塑料。" },
    ],
    safetyTips: [
      { type: "warning", content: "加热时小心烫伤" },
    ],
  },
  {
    title: "铁锈生成实验",
    description: "探索铁生锈的条件，理解氧化反应和铁锈的形成过程，讨论防锈方法。",
    category: "chemistry",
    subcategory: "无机化学",
    difficulty: "简单",
    grades: ["初一", "初二"],
    duration: "持续3-7天",
    materials: [
      { name: "铁钉", quantity: "4枚" },
      { name: "试管", quantity: "4个" },
      { name: "水", quantity: "适量" },
      { name: "食用油", quantity: "少量" },
      { name: "干燥剂", quantity: "1包" },
    ],
    steps: [
      { order: 1, title: "设置对照组", description: "分别将铁钉放入：空气中、水中、油封水中、干燥环境。" },
      { order: 2, title: "每日观察", description: "每天记录各组铁钉的颜色变化。" },
      { order: 3, title: "分析条件", description: "对比哪些条件下铁钉生锈最快/最慢。" },
      { order: 4, title: "得出结论", description: "总结铁生锈需要的条件：水和氧气同时存在。" },
    ],
    safetyTips: [
      { type: "info", content: "铁锈可能弄脏衣物" },
    ],
  },
  {
    title: "二氧化碳灭火实验",
    description: "制作二氧化碳并观察其灭火作用，理解二氧化碳的性质和灭火原理。",
    category: "chemistry",
    subcategory: "物质变化",
    difficulty: "中等",
    grades: ["初一", "初二", "初三"],
    duration: "20分钟",
    materials: [
      { name: "小苏打", quantity: "30克" },
      { name: "白醋", quantity: "100毫升" },
      { name: "蜡烛", quantity: "3支" },
      { name: "玻璃杯", quantity: "2个" },
      { name: "打火机", quantity: "1个" },
    ],
    steps: [
      { order: 1, title: "点燃蜡烛", description: "将蜡烛固定在杯底并点燃。" },
      { order: 2, title: "产生CO2", description: "在另一个杯中混合小苏打和醋。" },
      { order: 3, title: "倾倒气体", description: "将产生的气体缓缓倾倒向燃烧的蜡烛。" },
      { order: 4, title: "观察现象", description: "观察蜡烛熄灭，讨论CO2的性质。" },
    ],
    safetyTips: [
      { type: "warning", content: "注意火焰安全" },
      { type: "danger", content: "必须在通风处进行，需成人监护" },
    ],
  },
  {
    title: "隐形墨水实验",
    description: "用柠檬汁制作隐形墨水，通过加热使字迹显现，探索有机物氧化变色的原理。",
    category: "chemistry",
    subcategory: "有机化学",
    difficulty: "简单",
    grades: ["小学低年级", "小学高年级"],
    duration: "15分钟",
    materials: [
      { name: "柠檬", quantity: "1个" },
      { name: "棉签", quantity: "若干" },
      { name: "白纸", quantity: "若干" },
      { name: "吹风机或台灯", quantity: "1个" },
    ],
    steps: [
      { order: 1, title: "提取柠檬汁", description: "将柠檬切开，挤出柠檬汁到小碗中。" },
      { order: 2, title: "书写信息", description: "用棉签蘸柠檬汁在白纸上写字或画画。" },
      { order: 3, title: "晾干墨水", description: "等待纸张完全干燥，字迹几乎不可见。" },
      { order: 4, title: "加热显影", description: "用吹风机或台灯加热纸张，观察字迹显现。" },
    ],
    safetyTips: [
      { type: "warning", content: "加热时不要离纸太近，防止起火" },
    ],
  },
  {
    title: "彩色喷泉实验",
    description: "利用可乐和曼妥思的反应制造壮观的喷泉效果，探索物理性成核现象。",
    category: "chemistry",
    subcategory: "物质变化",
    difficulty: "简单",
    grades: ["小学高年级", "初一"],
    duration: "10分钟",
    materials: [
      { name: "可乐（2升装）", quantity: "1瓶" },
      { name: "曼妥思薄荷糖", quantity: "1管" },
      { name: "纸筒", quantity: "1个" },
    ],
    steps: [
      { order: 1, title: "选择场地", description: "在户外空旷处进行实验。" },
      { order: 2, title: "准备糖果", description: "将曼妥思糖放入纸筒，底部用纸挡住。" },
      { order: 3, title: "快速投放", description: "打开可乐瓶盖，迅速放入全部糖果。" },
      { order: 4, title: "观察喷泉", description: "立即后退，观察壮观的可乐喷泉。" },
    ],
    safetyTips: [
      { type: "warning", content: "必须在户外进行" },
      { type: "info", content: "远离后退，避免喷溅" },
    ],
  },
  {
    title: "彩虹糖水实验",
    description: "利用彩虹糖制作密度分层液体柱，观察不同浓度溶液的分层现象。",
    category: "chemistry",
    subcategory: "物质变化",
    difficulty: "简单",
    grades: ["小学低年级", "小学高年级"],
    duration: "20分钟",
    materials: [
      { name: "彩虹糖", quantity: "30颗" },
      { name: "温水", quantity: "适量" },
      { name: "小杯子", quantity: "5个" },
      { name: "试管或高杯", quantity: "1个" },
      { name: "滴管", quantity: "1个" },
    ],
    steps: [
      { order: 1, title: "制作糖水", description: "分别用不同数量的彩虹糖溶于相同量的水。" },
      { order: 2, title: "测试密度", description: "比较不同浓度糖水的颜色深浅。" },
      { order: 3, title: "分层倒入", description: "用滴管从最浓到最淡依次缓慢滴入。" },
      { order: 4, title: "观察彩虹", description: "观察形成的彩虹色分层效果。" },
    ],
    safetyTips: [
      { type: "info", content: "这是可食用实验，但糖分较高" },
    ],
  },
  {
    title: "碘淀粉反应实验",
    description: "探索碘遇淀粉变蓝的反应，学习定性检验淀粉的方法，检测日常食物中的淀粉。",
    category: "chemistry",
    subcategory: "分析化学",
    difficulty: "简单",
    grades: ["初一", "初二"],
    duration: "15分钟",
    materials: [
      { name: "碘酒", quantity: "1瓶" },
      { name: "土豆", quantity: "1个" },
      { name: "面包", quantity: "1片" },
      { name: "米饭", quantity: "少量" },
      { name: "苹果", quantity: "1个" },
    ],
    steps: [
      { order: 1, title: "准备样品", description: "将各种食物切成小块放在白盘中。" },
      { order: 2, title: "滴加碘酒", description: "在每种食物上滴1-2滴碘酒。" },
      { order: 3, title: "观察变色", description: "记录哪些食物变蓝色（含淀粉）。" },
      { order: 4, title: "分类总结", description: "将食物分为含淀粉和不含淀粉两类。" },
    ],
    safetyTips: [
      { type: "warning", content: "碘酒不可食用，实验后的食物要丢弃" },
    ],
  },

  // 生物实验 - 10个
  {
    title: "洋葱表皮细胞观察",
    description: "使用显微镜观察洋葱表皮细胞，学习制作临时装片的方法，认识植物细胞的基本结构。",
    category: "biology",
    subcategory: "细胞生物",
    difficulty: "中等",
    grades: ["初一", "初二"],
    duration: "30分钟",
    materials: [
      { name: "显微镜", quantity: "1台" },
      { name: "洋葱", quantity: "1个" },
      { name: "载玻片", quantity: "3片" },
      { name: "盖玻片", quantity: "3片" },
      { name: "碘液", quantity: "1瓶" },
      { name: "镊子", quantity: "1把" },
    ],
    steps: [
      { order: 1, title: "撕取表皮", description: "用镊子从洋葱内表皮撕取薄膜。" },
      { order: 2, title: "制作装片", description: "将表皮平铺在载玻片上，滴加碘液染色。" },
      { order: 3, title: "盖上盖片", description: "45度角缓慢放下盖玻片，避免气泡。" },
      { order: 4, title: "显微观察", description: "先用低倍镜找到细胞，再换高倍镜观察。" },
    ],
    safetyTips: [
      { type: "info", content: "切洋葱可能刺激眼睛" },
      { type: "warning", content: "载玻片易碎，小心操作" },
    ],
  },
  {
    title: "植物光合作用实验",
    description: "验证植物光合作用产生氧气，理解光合作用的条件和产物，认识植物在生态系统中的作用。",
    category: "biology",
    subcategory: "植物学",
    difficulty: "中等",
    grades: ["初二", "初三"],
    duration: "45分钟",
    materials: [
      { name: "水草", quantity: "若干" },
      { name: "玻璃漏斗", quantity: "1个" },
      { name: "试管", quantity: "1支" },
      { name: "烧杯", quantity: "1个" },
      { name: "台灯", quantity: "1个" },
    ],
    steps: [
      { order: 1, title: "搭建装置", description: "将水草放入装满水的烧杯，倒扣漏斗，上方倒扣试管。" },
      { order: 2, title: "光照处理", description: "用台灯照射水草30分钟。" },
      { order: 3, title: "收集气体", description: "观察气泡产生并收集在试管中。" },
      { order: 4, title: "验证氧气", description: "用带火星的木条检验收集的气体。" },
    ],
    safetyTips: [
      { type: "warning", content: "检验氧气时注意火焰安全" },
    ],
  },
  {
    title: "种子发芽条件实验",
    description: "探索种子发芽需要的条件，设计对照实验验证水分、温度、空气的影响。",
    category: "biology",
    subcategory: "植物学",
    difficulty: "简单",
    grades: ["小学高年级", "初一"],
    duration: "持续7-10天",
    materials: [
      { name: "绿豆", quantity: "50颗" },
      { name: "培养皿", quantity: "4个" },
      { name: "棉花", quantity: "适量" },
      { name: "保鲜膜", quantity: "1卷" },
    ],
    steps: [
      { order: 1, title: "设置对照组", description: "设置：有水有光、无水有光、有水无光、有水低温四组。" },
      { order: 2, title: "播种", description: "每组放10颗绿豆在湿棉花上。" },
      { order: 3, title: "每日观察", description: "记录每组种子的发芽数量和生长情况。" },
      { order: 4, title: "分析总结", description: "对比各组数据，得出发芽条件。" },
    ],
    safetyTips: [
      { type: "info", content: "保持棉花湿润但不要积水" },
    ],
  },
  {
    title: "蚂蚁行为观察实验",
    description: "观察蚂蚁的觅食行为和信息传递方式，了解蚂蚁的社会性行为和信息素通讯。",
    category: "biology",
    subcategory: "动物学",
    difficulty: "简单",
    grades: ["小学高年级", "初一"],
    duration: "30分钟",
    materials: [
      { name: "蚂蚁", quantity: "自然观察" },
      { name: "糖水", quantity: "少量" },
      { name: "面包屑", quantity: "少量" },
      { name: "放大镜", quantity: "1个" },
      { name: "记录本", quantity: "1本" },
    ],
    steps: [
      { order: 1, title: "寻找蚁群", description: "在户外找到活跃的蚂蚁活动区域。" },
      { order: 2, title: "放置食物", description: "在蚂蚁路径附近放置糖水和面包屑。" },
      { order: 3, title: "观察行为", description: "记录蚂蚁发现食物后的行为变化。" },
      { order: 4, title: "分析通讯", description: "观察蚂蚁如何通知同伴，分析信息素作用。" },
    ],
    safetyTips: [
      { type: "info", content: "观察时不要伤害蚂蚁" },
      { type: "warning", content: "小心被蚂蚁咬伤" },
    ],
  },
  {
    title: "制作酸奶实验",
    description: "利用乳酸菌发酵制作酸奶，了解发酵的原理和微生物在食品中的应用。",
    category: "biology",
    subcategory: "微生物",
    difficulty: "简单",
    grades: ["小学高年级", "初一", "初二"],
    duration: "8-12小时",
    materials: [
      { name: "纯牛奶", quantity: "500毫升" },
      { name: "酸奶（含活菌）", quantity: "50毫升" },
      { name: "保温杯", quantity: "1个" },
      { name: "温度计", quantity: "1个" },
    ],
    steps: [
      { order: 1, title: "加热牛奶", description: "将牛奶加热到40-45度。" },
      { order: 2, title: "接种菌种", description: "加入酸奶作为菌种，搅拌均匀。" },
      { order: 3, title: "保温发酵", description: "倒入保温杯，保持温度发酵8-12小时。" },
      { order: 4, title: "品尝成果", description: "观察酸奶质地，品尝你的成果。" },
    ],
    safetyTips: [
      { type: "info", content: "使用新鲜的牛奶和酸奶" },
      { type: "warning", content: "发酵过程保持清洁卫生" },
    ],
  },
  {
    title: "DNA提取实验",
    description: "从水果中提取DNA，直观看到遗传物质，理解DNA的基本性质和提取原理。",
    category: "biology",
    subcategory: "细胞生物",
    difficulty: "中等",
    grades: ["八年级", "九年级", "十年级"],
    duration: "30分钟",
    materials: [
      { name: "香蕉或草莓", quantity: "1个" },
      { name: "洗洁精", quantity: "少量" },
      { name: "食盐", quantity: "少量" },
      { name: "95%酒精（冰冻）", quantity: "50毫升" },
      { name: "滤纸", quantity: "1张" },
    ],
    steps: [
      { order: 1, title: "捣碎水果", description: "将水果放入密封袋中捣成泥状。" },
      { order: 2, title: "裂解细胞", description: "加入洗洁精和盐水，轻轻混合。" },
      { order: 3, title: "过滤溶液", description: "用滤纸过滤，收集清液。" },
      { order: 4, title: "沉淀DNA", description: "沿杯壁缓慢加入冰酒精，观察白色丝状DNA。" },
    ],
    safetyTips: [
      { type: "warning", content: "酒精易燃，远离火源" },
    ],
  },
  {
    title: "叶片蒸腾作用实验",
    description: "观察植物的蒸腾作用，理解植物体内水分运输和蒸腾散热的生理意义。",
    category: "biology",
    subcategory: "植物学",
    difficulty: "简单",
    grades: ["初一", "初二"],
    duration: "2-3小时",
    materials: [
      { name: "盆栽植物", quantity: "1盆" },
      { name: "透明塑料袋", quantity: "2个" },
      { name: "橡皮筋", quantity: "2根" },
    ],
    steps: [
      { order: 1, title: "套袋处理", description: "用塑料袋分别套住一枝带叶和去叶的枝条。" },
      { order: 2, title: "密封袋口", description: "用橡皮筋密封袋口。" },
      { order: 3, title: "阳光照射", description: "放在阳光下2-3小时。" },
      { order: 4, title: "对比观察", description: "比较两个袋子内的水珠数量。" },
    ],
    safetyTips: [
      { type: "info", content: "选择生长旺盛的植物效果更好" },
    ],
  },
  {
    title: "心率测量实验",
    description: "学习正确测量脉搏的方法，探索运动对心率的影响，了解心血管系统的工作原理。",
    category: "biology",
    subcategory: "人体生理",
    difficulty: "简单",
    grades: ["小学高年级", "初一", "初二"],
    duration: "20分钟",
    materials: [
      { name: "秒表", quantity: "1个" },
      { name: "记录表", quantity: "1张" },
    ],
    steps: [
      { order: 1, title: "学习测脉", description: "找到手腕内侧的脉搏位置。" },
      { order: 2, title: "静息心率", description: "安静状态下测量1分钟脉搏数。" },
      { order: 3, title: "运动后测量", description: "做20个深蹲后立即再次测量。" },
      { order: 4, title: "恢复监测", description: "每分钟测量一次，直到恢复静息水平。" },
    ],
    safetyTips: [
      { type: "info", content: "运动量根据个人体质调整" },
      { type: "warning", content: "身体不适者不要剧烈运动" },
    ],
  },
  {
    title: "食物链模拟实验",
    description: "通过游戏模拟生态系统中的食物链关系，理解能量流动和生态平衡的概念。",
    category: "biology",
    subcategory: "生态环境",
    difficulty: "简单",
    grades: ["小学高年级", "初一"],
    duration: "30分钟",
    materials: [
      { name: "绿色卡片（草）", quantity: "50张" },
      { name: "蓝色卡片（兔子）", quantity: "20张" },
      { name: "红色卡片（狐狸）", quantity: "5张" },
      { name: "场地", quantity: "1块" },
    ],
    steps: [
      { order: 1, title: "分配角色", description: "学生分为草、兔子、狐狸三组。" },
      { order: 2, title: "第一轮游戏", description: "兔子收集草卡片，狐狸追捕兔子。" },
      { order: 3, title: "统计数据", description: "记录每轮存活的各类生物数量。" },
      { order: 4, title: "分析规律", description: "讨论食物链中各级生物数量的关系。" },
    ],
    safetyTips: [
      { type: "info", content: "游戏中注意安全，不要碰撞" },
    ],
  },
  {
    title: "植物向光性实验",
    description: "验证植物的向光性，探索生长素在植物向光性中的作用机制。",
    category: "biology",
    subcategory: "植物学",
    difficulty: "简单",
    grades: ["初一", "初二", "初三"],
    duration: "持续5-7天",
    materials: [
      { name: "绿豆苗", quantity: "若干" },
      { name: "纸盒", quantity: "1个" },
      { name: "剪刀", quantity: "1把" },
    ],
    steps: [
      { order: 1, title: "准备暗箱", description: "在纸盒侧面开一个小孔。" },
      { order: 2, title: "放入植物", description: "将绿豆苗放入盒内，小孔朝向光源。" },
      { order: 3, title: "每日观察", description: "记录植物弯曲生长的方向和程度。" },
      { order: 4, title: "分析原理", description: "讨论生长素分布与向光弯曲的关系。" },
    ],
    safetyTips: [
      { type: "info", content: "保持盒内适当通风" },
    ],
  },
]

export const aiExperimentTemplates: AIExperimentSuggestion[] = RAW_TEMPLATES.map((t) => ({
  ...t,
  grades: normalizeGradesToPrimary(t.grades),
}))

// 根据关键词匹配合适的实验模板
export function getAIExperimentSuggestion(keyword: string): AIExperimentSuggestion {
  const lowerKeyword = keyword.toLowerCase()
  
  // 尝试匹配关键词
  let matched = aiExperimentTemplates.find(exp => 
    exp.title.toLowerCase().includes(lowerKeyword) ||
    exp.description.toLowerCase().includes(lowerKeyword) ||
    exp.subcategory.toLowerCase().includes(lowerKeyword)
  )
  
  // 如果没找到，随机返回一个
  if (!matched) {
    const randomIndex = Math.floor(Math.random() * aiExperimentTemplates.length)
    matched = aiExperimentTemplates[randomIndex]
  }
  
  return matched
}

// 根据学科获取实验列表
export function getExperimentsByCategory(category: "physics" | "chemistry" | "biology"): AIExperimentSuggestion[] {
  return aiExperimentTemplates.filter(exp => exp.category === category)
}
