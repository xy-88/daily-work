import type { Category, Tx } from './types'

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

const now = Date.now()
const day = 86400000

function d(offset: number): string {
  return new Date(now - offset * day).toISOString().slice(0, 10)
}

export const SAMPLE_TXS: Tx[] = [
  { id: 's1', date: d(0), time: '12:30', type: 'expense', amount: 38.5, counterparty: '美团外卖', commodity: '午餐·黄焖鸡', method: '零钱', platform: 'wechat', categoryId: 'cat_food', updatedAt: now - 1000 },
  { id: 's2', date: d(0), time: '09:15', type: 'expense', amount: 6.0, counterparty: '青桔骑行', commodity: '共享单车', method: '余额', platform: 'alipay', categoryId: 'cat_transport', updatedAt: now - 2000 },
  { id: 's3', date: d(1), time: '20:42', type: 'expense', amount: 88.0, counterparty: '海底捞火锅', commodity: '晚餐', method: '花呗', platform: 'alipay', categoryId: 'cat_food', updatedAt: now - 3 * day },
  { id: 's4', date: d(1), time: '15:20', type: 'expense', amount: 45.9, counterparty: '罗森便利店', commodity: '零食饮料', method: '零钱', platform: 'wechat', categoryId: 'cat_shopping', updatedAt: now - 3 * day },
  { id: 's5', date: d(2), time: '10:00', type: 'income', amount: 12800.0, counterparty: '某科技公司', commodity: '7月工资', method: '银行卡', platform: 'alipay', categoryId: 'cat_salary', updatedAt: now - 4 * day },
  { id: 's6', date: d(2), time: '14:10', type: 'expense', amount: 12.0, counterparty: '滴滴出行', commodity: '快车', method: '零钱', platform: 'wechat', categoryId: 'cat_transport', updatedAt: now - 4 * day },
  { id: 's7', date: d(3), time: '19:30', type: 'expense', amount: 39.9, counterparty: '腾讯视频', commodity: '会员续费', method: '余额', platform: 'wechat', categoryId: 'cat_entertain', updatedAt: now - 5 * day },
  { id: 's8', date: d(4), time: '11:05', type: 'expense', amount: 156.8, counterparty: '京东', commodity: '日用纸巾洗衣液', method: '白条', platform: 'wechat', categoryId: 'cat_shopping', updatedAt: now - 6 * day },
  { id: 's9', date: d(5), time: '08:45', type: 'expense', amount: 220.0, counterparty: '国家电网', commodity: '电费充值', method: '余额', platform: 'alipay', categoryId: 'cat_housing', updatedAt: now - 7 * day },
  { id: 's10', date: d(6), time: '21:15', type: 'expense', amount: 28.0, counterparty: '喜茶', commodity: '多肉葡萄', method: '零钱', platform: 'wechat', categoryId: 'cat_food', updatedAt: now - 8 * day },
  { id: 's11', date: d(7), time: '13:20', type: 'expense', amount: 350.0, counterparty: '某齿科诊所', commodity: '洗牙', method: '花呗', platform: 'alipay', categoryId: 'cat_medical', updatedAt: now - 9 * day },
  { id: 's12', date: d(8), time: '18:00', type: 'expense', amount: 64.0, counterparty: '滴滴出行', commodity: '快车去机场', method: '零钱', platform: 'wechat', categoryId: 'cat_transport', updatedAt: now - 10 * day },
  { id: 's13', date: d(9), time: '12:00', type: 'expense', amount: 45.0, counterparty: '星巴克', commodity: '拿铁×2', method: '余额', platform: 'wechat', categoryId: 'cat_food', updatedAt: now - 11 * day },
  { id: 's14', date: d(10), time: '10:30', type: 'income', amount: 128.0, counterparty: '淘宝', commodity: '退款', method: '余额', platform: 'alipay', categoryId: 'cat_salary', updatedAt: now - 12 * day },
  { id: 's15', date: d(11), time: '16:40', type: 'expense', amount: 199.0, counterparty: 'B站', commodity: '大会员年卡', method: '零钱', platform: 'wechat', categoryId: 'cat_entertain', updatedAt: now - 13 * day },
  { id: 's16', date: d(13), time: '09:30', type: 'expense', amount: 78.5, counterparty: '美团外卖', commodity: '早餐团购', method: '零钱', platform: 'wechat', categoryId: 'cat_food', updatedAt: now - 15 * day },
  { id: 's17', date: d(15), time: '20:00', type: 'expense', amount: 320.0, counterparty: '中国移动', commodity: '话费充值', method: '余额', platform: 'alipay', categoryId: 'cat_housing', updatedAt: now - 17 * day },
  { id: 's18', date: d(18), time: '14:25', type: 'expense', amount: 99.0, counterparty: '屈臣氏', commodity: '护肤品', method: '花呗', platform: 'alipay', categoryId: 'cat_shopping', updatedAt: now - 20 * day },
  { id: 's19', date: d(22), time: '11:50', type: 'expense', amount: 56.0, counterparty: '肯德基', commodity: '午餐套餐', method: '零钱', platform: 'wechat', categoryId: 'cat_food', updatedAt: now - 24 * day },
  { id: 's20', date: d(25), time: '17:10', type: 'expense', amount: 280.0, counterparty: '12306', commodity: '高铁票', method: '银行卡', platform: 'alipay', categoryId: 'cat_transport', updatedAt: now - 27 * day },
]
