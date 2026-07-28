import type { Category } from './types'

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_food', name: '餐饮', color: '#9B2C2C', type: 'expense', sortOrder: 1, keywords: ['美团', '饿了么', '肯德基', '麦当劳', '星巴克', '瑞幸', 'luckin', '外卖', '餐厅', '海底捞', '喜茶', '蜜雪', '奈雪', '库迪', '霸王茶姬'] },
  { id: 'cat_transport', name: '交通', color: '#3A332C', type: 'expense', sortOrder: 2, keywords: ['滴滴', '高德', '地铁', '公交', '12306', '携程', '打车', '出行', '哈啰', '青桔', '美团打车', '铁路', '航空', '机票', '加油'] },
  { id: 'cat_shopping', name: '购物', color: '#B8893E', type: 'expense', sortOrder: 3, keywords: ['淘宝', '京东', '拼多多', '天猫', '超市', '便利店', '7-11', '罗森', '全家', '屈臣氏', '名创', '优衣库'] },
  { id: 'cat_entertain', name: '娱乐', color: '#7C3AED', type: 'expense', sortOrder: 4, keywords: ['电影', '猫眼', '腾讯视频', '爱奇艺', '优酷', '网易云', 'QQ音乐', '游戏', 'Steam', 'B站', 'bilibili', '演唱会', 'KTV'] },
  { id: 'cat_housing', name: '居家', color: '#2F5D3A', type: 'expense', sortOrder: 5, keywords: ['水电', '燃气', '物业', '房租', '宽带', '电费', '水费', '移动', '联通', '电信'] },
  { id: 'cat_medical', name: '医疗', color: '#DC2626', type: 'expense', sortOrder: 6, keywords: ['医院', '药店', '诊所', '医保', '挂号', '大药房', '齿科', '体检'] },
  { id: 'cat_salary', name: '工资', color: '#2F5D3A', type: 'income', sortOrder: 7, keywords: ['工资', '薪资', '报销', '退款', '薪酬', '薪水', '奖金', '发放'] },
  { id: 'cat_transfer', name: '转账', color: '#6B6357', type: 'both', sortOrder: 8, keywords: ['转账', '红包', '收款', 'AA', '代付', '群收款'] },
]


