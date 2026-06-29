import { crudMock } from './crud'

const goods = Array.from({ length: 18 }, (_, i) => ({
  id: i + 1,
  name: `商品${i + 1}`,
  category: ['原料', '半成品', '成品'][i % 3],
  unit: ['个', '箱', '千克'][i % 3],
  spec: `规格-${i + 1}`,
  price: (i + 1) * 10,
}))
const suppliers = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `供应商${i + 1}`,
  contact: `联系人${i + 1}`,
  phone: `1380000${String(i + 1).padStart(4, '0')}`,
}))
const customers = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `客户${i + 1}`,
  contact: `联系人${i + 1}`,
  phone: `1390000${String(i + 1).padStart(4, '0')}`,
}))
const warehouses = [
  { id: 1, name: '主仓库', location: '上海' },
  { id: 2, name: '北方仓', location: '北京' },
  { id: 3, name: '南方仓', location: '广州' },
]
const purchases = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  orderNo: `PO${String(20260000 + i + 1)}`,
  supplierName: `供应商${(i % 12) + 1}`,
  amount: (i + 1) * 1000,
  status: ['待审核', '已审核', '已入库'][i % 3],
}))
const sales = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  orderNo: `SO${String(20260000 + i + 1)}`,
  customerName: `客户${(i % 12) + 1}`,
  amount: (i + 1) * 1200,
  status: ['待审核', '已审核', '已出库'][i % 3],
}))
const stocks = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  goodsName: `商品${(i % 18) + 1}`,
  warehouseName: ['主仓库', '北方仓', '南方仓'][i % 3],
  quantity: (i + 1) * 5,
}))
const inbounds = Array.from({ length: 14 }, (_, i) => ({
  id: i + 1,
  inboundNo: `IN${String(20260000 + i + 1)}`,
  sourceOrderNo: `PO${String(20260000 + i + 1)}`,
  warehouseName: ['主仓库', '北方仓', '南方仓'][i % 3],
  amount: (i + 1) * 1000,
  date: '2026-06-29',
}))
const outbounds = Array.from({ length: 14 }, (_, i) => ({
  id: i + 1,
  outboundNo: `OUT${String(20260000 + i + 1)}`,
  sourceOrderNo: `SO${String(20260000 + i + 1)}`,
  warehouseName: ['主仓库', '北方仓', '南方仓'][i % 3],
  amount: (i + 1) * 1200,
  date: '2026-06-29',
}))
const flows = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  type: i % 2 === 0 ? '入库' : '出库',
  goodsName: `商品${(i % 18) + 1}`,
  warehouseName: ['主仓库', '北方仓', '南方仓'][i % 3],
  quantity: (i + 1) * 5,
  date: '2026-06-29',
}))
const checks = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  checkNo: `CK${String(20260000 + i + 1)}`,
  warehouseName: ['主仓库', '北方仓', '南方仓'][i % 3],
  status: ['进行中', '已完成'][i % 2],
  date: '2026-06-29',
}))

export default [
  ...crudMock('/scm/goods', goods),
  ...crudMock('/scm/supplier', suppliers),
  ...crudMock('/scm/customer', customers),
  ...crudMock('/scm/warehouse', warehouses),
  ...crudMock('/scm/purchase', purchases),
  ...crudMock('/scm/sale', sales),
  ...crudMock('/scm/stock', stocks),
  ...crudMock('/scm/inbound', inbounds),
  ...crudMock('/scm/outbound', outbounds),
  ...crudMock('/scm/flow', flows),
  ...crudMock('/scm/check', checks),
]
