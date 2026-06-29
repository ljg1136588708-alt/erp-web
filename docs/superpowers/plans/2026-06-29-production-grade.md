# 生产级完善实现计划(订单主从 / 库存联动 / 校验 / 契约)

> 目标:把两大模块做到"现实能用"的前端深度(仍走 Mock,后端就绪可无缝切),先满足客户演示。
> 用 subagent-driven-development 分批执行,复用 `useCrud`/`crudMock`/`v-permission`。

## 现状澄清
- Mock 跑在 Node 端,数据在内存,**刷新浏览器不丢**,仅重启 dev server 重置 → 演示一会话内稳定,不需 localStorage 持久化。
- 当前缺的"生产深度":订单无明细行、收发货不联动库存、盘点无差异、表单缺校验、无接口契约。

## 数据模型(本计划目标态)

```
商品 goods      : { id, name, category, unit, spec, price }
仓库 warehouse  : { id, name, location }
库存 stock      : { id, goodsId, goodsName, warehouseId, warehouseName, quantity }   // 按 商品×仓库
采购单 purchase : { id, orderNo, supplierName, warehouseId, warehouseName, date, status, amount, items }
销售单 sale     : { id, orderNo, customerName, warehouseId, warehouseName, date, status, amount, items }
明细 item       : { goodsId, goodsName, qty, price, subtotal }   // subtotal=qty*price, amount=Σsubtotal
入库单 inbound  : { id, inboundNo, sourceOrderNo, warehouseName, date, amount, items }
出库单 outbound : { id, outboundNo, sourceOrderNo, warehouseName, date, amount, items }
盘点 check      : { id, checkNo, warehouseId, warehouseName, status, date, items }
盘点明细        : { goodsId, goodsName, systemQty, actualQty, diff }
```

## 共享库存与业务端点(超出通用 CRUD)

新建 `mock/inventory.ts`:导出共享 `stocks` 数组 + `getQty/addStock/reduceStock` 帮助函数,供库存页、收货、发货、盘点共同读写。

业务端点(放各自 mock 文件):
- `GET  /api/scm/goods/options`     → `[{ id, name, price, unit }]`(明细选商品用)
- `GET  /api/scm/warehouse/options` → `[{ id, name }]`(仓库下拉)
- `POST /api/scm/purchase/:id/receive` → 逐明细 addStock(goodsId,warehouseId,qty);单据 status=已入库;生成入库单。返回 ok。
- `POST /api/scm/sale/:id/ship`     → 先校验每行 qty≤可用库存,不足则 `{code:1,message:'xx库存不足'}`;否则 reduceStock;status=已出库;生成出库单。
- `POST /api/scm/check/:id/finish`  → 逐明细把 stock 调整为 actualQty;status=已完成。

## 批次

### 批次 1:库存数据模型重构 + options 端点
- `mock/inventory.ts`:共享 `stocks`(由部分 商品×仓库 生成初始量)+ 帮助函数。
- `mock/scm.ts`:`stock` 资源改为读共享 `stocks`(不再独立随机种子);新增 goods/options、warehouse/options 端点。
- `src/views/scm/stock.vue`:列改 商品/仓库/数量(读新结构),只读不变。
- 验证 build/test + 接口探活。

### 批次 2:采购订单主从 + 收货入库联动
- 共享组件 `src/components/OrderItemsEditor.vue`:动态明细表(选商品自动带价、填数量、算小计、加/删行、合计),`v-model` 绑定 items 数组,emit 合计。
- `purchase.vue`:新增/编辑改 Drawer(主表字段 + OrderItemsEditor),amount 由明细自动算;列表展开行显示明细;「收货」调 receive 端点后刷新。
- 校验:至少一行、qty>0、必选商品/仓库。
- mock:purchase 种子带 items;receive 端点联动 inventory + 生成 inbound。

### 批次 3:销售订单主从 + 发货出库 + 库存不足拦截
- `sale.vue`:同采购,「发货」调 ship 端点;库存不足时后端返回错误、前端提示并阻止。
- mock:sale 种子带 items;ship 端点校验库存 + reduceStock + 生成 outbound。

### 批次 4:盘点差异 + 全表单校验
- `check.vue`:盘点单带明细(systemQty 取自库存、actualQty 录入、diff 自动算);「完成」调 finish 端点调整库存。
- 给所有新增/编辑表单补 `a-form` 规则(必填、数字范围),提交前校验。

### 批次 5:接口契约文档 + 端到端验证
- `docs/api-contract.md`:逐端点列出 路径/方法/请求/响应/错误码,供后端对接。
- dev 全流程走查:建采购单→收货→库存增加;建销售单→发货(含库存不足拦截)→库存减少;盘点调整。里程碑提交。

## Self-Review / 边界
- 仍走 Mock(Node 内存),非真实持久化/鉴权/并发——这些待后端联调。
- 不做:多仓调拨、批次/序列号、价税分离、审批流引擎、报表 BI(超出"可演示进销存"范畴,YAGNI)。
