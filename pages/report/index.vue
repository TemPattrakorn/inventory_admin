<template>
  <v-app-bar title="รายงานการเบิกวัสดุ">
    <v-btn
      prepend-icon="mdi-download"
      variant="tonal"
      color="primary"
      class="mr-4"
      @click="exportToExcel"
      :disabled="loading || !reportData.length"
      :loading="exportLoading"
    >
      ส่งออก Excel
    </v-btn>
  </v-app-bar>

  <v-container fluid class="pa-4">
    <!-- Date Range Selection -->
    <v-card class="mb-4">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-calendar-range</v-icon>
        เลือกช่วงวันที่
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-menu
              v-model="startDateMenu"
              :close-on-content-click="false"
              transition="scale-transition"
              offset-y
              min-width="auto"
            >
              <template v-slot:activator="{ props }">
                <v-text-field
                  v-model="formattedStartDate"
                  label="วันที่เริ่มต้น"
                  prepend-inner-icon="mdi-calendar"
                  readonly
                  v-bind="props"
                  density="compact"
                  clearable
                  @click:clear="startDate = null; generateReport()"
                />
              </template>
              <v-date-picker
                v-model="startDate"
                @update:model-value="startDateMenu = false; generateReport()"
                no-title
                scrollable
              />
            </v-menu>
          </v-col>
          
          <v-col cols="12" md="6">
            <v-menu
              v-model="endDateMenu"
              :close-on-content-click="false"
              transition="scale-transition"
              offset-y
              min-width="auto"
            >
              <template v-slot:activator="{ props }">
                <v-text-field
                  v-model="formattedEndDate"
                  label="วันที่สิ้นสุด"
                  prepend-inner-icon="mdi-calendar"
                  readonly
                  v-bind="props"
                  density="compact"
                  clearable
                  @click:clear="endDate = null; generateReport()"
                />
              </template>
              <v-date-picker
                v-model="endDate"
                @update:model-value="endDateMenu = false; generateReport()"
                no-title
                scrollable
              />
            </v-menu>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Loading State -->
    <v-row v-if="loading">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary" size="64" />
        <div class="mt-4">กำลังประมวลผลข้อมูล...</div>
      </v-col>
    </v-row>

    <!-- Error State -->
    <v-row v-else-if="error">
      <v-col cols="12">
        <v-alert type="error" prominent>
          <v-alert-title>เกิดข้อผิดพลาด</v-alert-title>
          {{ error.message || error }}
        </v-alert>
      </v-col>
    </v-row>

    <!-- No Data State -->
    <v-row v-else-if="!reportData.length">
      <v-col cols="12" class="text-center">
        <v-icon size="64" color="grey-lighten-1">mdi-chart-line</v-icon>
        <div class="text-h6 mt-4 text-grey-darken-1">
          ไม่มีข้อมูลในช่วงเวลาที่เลือก
        </div>
      </v-col>
    </v-row>

    <!-- Report Table -->
    <v-card v-else>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-chart-box-outline</v-icon>
        รายงานการเบิกวัสดุประจำเดือน ({{ formatDateRange() }})
      </v-card-title>
      
      <v-card-text class="pa-0">
        <div class="report-container">
          <table class="report-table">
            <thead>
              <tr>
                <th class="sticky-column item-column" rowspan="2">รายการ</th>
                <th v-for="month in monthColumns" :key="month.key" class="month-header" colspan="2">
                  {{ month.label }}
                </th>
                <th class="summary-header" rowspan="2">รวมเบิก</th>
                <th class="stock-header" rowspan="2">คงเหลือ</th>
              </tr>
              <tr>
                <template v-for="month in monthColumns" :key="month.key">
                  <th class="sub-header add-header">จำนวนที่เพิ่ม</th>
                  <th class="sub-header req-header">จำนวนที่เบิก</th>
                </template>
              </tr>
            </thead>
            <tbody>
              <template v-for="categoryData in reportData" :key="categoryData.category">
                <!-- Category Header -->
                <tr class="category-row">
                  <td class="sticky-column category-cell" :colspan="(monthColumns.length * 2) + 3">
                    {{ categoryData.category || 'ไม่ระบุหมวดหมู่' }}
                  </td>
                </tr>
                <!-- Item Rows -->
                <tr v-for="item in categoryData.items" :key="item.id" class="item-row">
                  <td class="sticky-column item-cell">
                    <div class="d-flex align-center">
                      <v-avatar size="32" rounded="lg" class="mr-3">
                        <v-img
                          :src="item.imageUrl || '/No_image_available.png'"
                          :alt="item.name"
                        />
                      </v-avatar>
                      <div>
                        <div class="font-weight-medium">{{ item.name }}</div>
                        <div class="text-caption text-grey-darken-1">หน่วย: {{ item.unit }}</div>
                      </div>
                    </div>
                  </td>
                  <template v-for="month in monthColumns" :key="month.key">
                    <td class="data-cell addition-cell">
                      {{ item.monthlyData[month.key]?.addition || 0 }}
                    </td>
                    <td class="data-cell acquisition-cell">
                      {{ item.monthlyData[month.key]?.acquisition || 0 }}
                    </td>
                  </template>
                  <td class="data-cell summary-cell">
                    {{ item.totalAcquisition }}
                  </td>
                  <td class="data-cell stock-cell">
                    {{ item.stockqnt }}
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })

// Imports
import { ref, onMounted, computed } from 'vue'
import { useRuntimeConfig } from '#app'
import { formatDateThai, formatThaiMonthYear, getThaiMonthName } from '~/utils/date'

// Configuration
const config = useRuntimeConfig()
const API_BASE_URL = config.public.apiUrl
const API_BEARER_TOKEN = config.public.apiToken

// Reactive data
const items = ref([])
const requisitions = ref([])
const inventoryLogs = ref([])
const reportData = ref([])
const loading = ref(true)
const error = ref(null)
const exportLoading = ref(false)

// Date selection
const currentDate = new Date()
const currentYear = currentDate.getFullYear()
const currentMonth = currentDate.getMonth()

// Set default date range: first day of current year to current date
const startDate = ref(new Date(currentYear, 0, 1)) // January 1st of current year
const endDate = ref(currentDate)
const startDateMenu = ref(false)
const endDateMenu = ref(false)

// Static data
const monthOptions = ref([
  { label: 'ม.ค.', longLabel: 'มกราคม', value: 1 },
  { label: 'ก.พ.', longLabel: 'กุมภาพันธ์', value: 2 },
  { label: 'มี.ค.', longLabel: 'มีนาคม', value: 3 },
  { label: 'เม.ย.', longLabel: 'เมษายน', value: 4 },
  { label: 'พ.ค.', longLabel: 'พฤษภาคม', value: 5 },
  { label: 'มิ.ย.', longLabel: 'มิถุนายน', value: 6 },
  { label: 'ก.ค.', longLabel: 'กรกฎาคม', value: 7 },
  { label: 'ส.ค.', longLabel: 'สิงหาคม', value: 8 },
  { label: 'ก.ย.', longLabel: 'กันยายน', value: 9 },
  { label: 'ต.ค.', longLabel: 'ตุลาคม', value: 10 },
  { label: 'พ.ย.', longLabel: 'พฤศจิกายน', value: 11 },
  { label: 'ธ.ค.', longLabel: 'ธันวาคม', value: 12 }
])

// Computed properties
const monthColumns = computed(() => {
  if (!startDate.value || !endDate.value) return []
  
  const columns = []
  const start = new Date(startDate.value)
  const end = new Date(endDate.value)
  
  // Helper function to check if date is first day of month
  const isFirstDayOfMonth = (date) => date.getDate() === 1
  
  // Helper function to check if date is last day of month
  const isLastDayOfMonth = (date) => {
    const nextDay = new Date(date)
    nextDay.setDate(date.getDate() + 1)
    return nextDay.getMonth() !== date.getMonth()
  }
  
  // Start from the first day of the start month
  const current = new Date(start.getFullYear(), start.getMonth(), 1)
  
  // Generate columns for each month in the range
  while (current <= end) {
    const year = current.getFullYear()
    const month = current.getMonth() + 1
    const monthData = monthOptions.value.find(m => m.value === month)
    
    let label = `${monthData.longLabel} ${new Intl.DateTimeFormat('th-TH-u-ca-buddhist', { year: 'numeric' }).format(new Date(year, 0, 1))}`
    let columnStart = new Date(current)
    let columnEnd = new Date(year, month - 1 + 1, 0) // Last day of current month
    
    // Check if this is the first month and doesn't start on the 1st
    if (current.getTime() === new Date(start.getFullYear(), start.getMonth(), 1).getTime() && !isFirstDayOfMonth(start)) {
      columnStart = new Date(start)
      label = `${start.getDate()} ${monthData.longLabel} ${new Intl.DateTimeFormat('th-TH-u-ca-buddhist', { year: 'numeric' }).format(new Date(year, 0, 1))}`
    }
    
    // Check if this is the last month and doesn't end on the last day
    if (year === end.getFullYear() && month - 1 === end.getMonth() && !isLastDayOfMonth(end)) {
      columnEnd = new Date(end)
      if (current.getTime() === new Date(start.getFullYear(), start.getMonth(), 1).getTime() && !isFirstDayOfMonth(start)) {
        // Both partial start and end in same month
        label = `${start.getDate()}-${end.getDate()} ${monthData.longLabel} ${new Intl.DateTimeFormat('th-TH-u-ca-buddhist', { year: 'numeric' }).format(new Date(year, 0, 1))}`
      } else {
        // Just partial end
        label = `${end.getDate()} ${monthData.longLabel} ${new Intl.DateTimeFormat('th-TH-u-ca-buddhist', { year: 'numeric' }).format(new Date(year, 0, 1))}`
      }
    }
    
    columns.push({
      key: `${year}-${month.toString().padStart(2, '0')}`,
      label: label,
      month: month,
      year: year,
      startDate: columnStart,
      endDate: columnEnd
    })
    
    // Move to next month
    current.setMonth(current.getMonth() + 1)
  }
  
  return columns
})

// Computed properties for formatted dates
const formattedStartDate = computed(() => formatDateThai(startDate.value, 'short'))

const formattedEndDate = computed(() => formatDateThai(endDate.value, 'short'))

// API Functions
const fetchItems = async () => {
  try {
    // Use pagination to ensure we get all items
    const pageSize = 100
    const res = await fetch(`${API_BASE_URL}/api/items?populate=*&pagination[page]=1&pagination[pageSize]=${pageSize}`, {
      headers: {
        Authorization: `Bearer ${API_BEARER_TOKEN}`
      }
    })
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }
    
    const firstPageData = await res.json()
    let allItemsData = firstPageData.data || []
    const pagination = firstPageData.meta.pagination
    
    // Fetch additional pages if needed
    if (pagination.pageCount > 1) {
      const pagePromises = []
      for (let page = 2; page <= pagination.pageCount; page++) {
        pagePromises.push(
          fetch(`${API_BASE_URL}/api/items?populate=*&pagination[page]=${page}&pagination[pageSize]=${pageSize}`, {
            headers: { Authorization: `Bearer ${API_BEARER_TOKEN}` }
          }).then(res => {
            if (!res.ok) throw new Error(`Failed to fetch page ${page}`)
            return res.json()
          })
        )
      }
      
      const additionalPagesData = await Promise.all(pagePromises)
      additionalPagesData.forEach(pageData => {
        if (pageData && pageData.data) {
          allItemsData = [...allItemsData, ...pageData.data]
        }
      })
    }
    
    // Process items to extract image URLs (same pattern as manage/index.vue)
    const processedItems = allItemsData.map(item => {
      let imageUrl = null
      if (item.imgpath && Array.isArray(item.imgpath) && item.imgpath.length > 0) {
        const img = item.imgpath[0]
        if (img.formats && img.formats.thumbnail && img.formats.thumbnail.url) {
          imageUrl = `${API_BASE_URL}` + img.formats.thumbnail.url
        } else if (img.formats && img.formats.small && img.formats.small.url) {
          imageUrl = `${API_BASE_URL}` + img.formats.small.url
        } else if (img.url) {
          imageUrl = `${API_BASE_URL}` + img.url
        }
      }
      return { ...item, imageUrl }
    })
    
    items.value = processedItems
    console.log('Items fetched successfully:', items.value.length, 'items')
  } catch (e) {
    console.error('Error fetching items:', e)
    throw e
  }
}

const fetchRequisitions = async () => {
  try {
    // Use pagination to ensure we get all completed requisitions
    const pageSize = 100
    const res = await fetch(`${API_BASE_URL}/api/requisitions?populate[requisition_items][populate]=item&filters[reqstatus][$eq]=completed&pagination[page]=1&pagination[pageSize]=${pageSize}`, {
      headers: {
        Authorization: `Bearer ${API_BEARER_TOKEN}`
      }
    })
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }
    
    const firstPageData = await res.json()
    let allRequisitionsData = firstPageData.data || []
    const pagination = firstPageData.meta.pagination
    
    // Fetch additional pages if needed
    if (pagination.pageCount > 1) {
      const pagePromises = []
      for (let page = 2; page <= pagination.pageCount; page++) {
        pagePromises.push(
          fetch(`${API_BASE_URL}/api/requisitions?populate[requisition_items][populate]=item&filters[reqstatus][$eq]=completed&pagination[page]=${page}&pagination[pageSize]=${pageSize}`, {
            headers: { Authorization: `Bearer ${API_BEARER_TOKEN}` }
          }).then(res => {
            if (!res.ok) throw new Error(`Failed to fetch page ${page}`)
            return res.json()
          })
        )
      }
      
      const additionalPagesData = await Promise.all(pagePromises)
      additionalPagesData.forEach(pageData => {
        if (pageData && pageData.data) {
          allRequisitionsData = [...allRequisitionsData, ...pageData.data]
        }
      })
    }
    
    requisitions.value = allRequisitionsData
    console.log('Requisitions fetched successfully:', requisitions.value.length, 'requisitions')
  } catch (e) {
    console.error('Error fetching requisitions:', e)
    throw e
  }
}

const fetchInventoryLogs = async () => {
  try {
    // Use pagination to ensure we get all inventory logs
    const pageSize = 100
    const res = await fetch(`${API_BASE_URL}/api/inventory-logs?populate=*&pagination[page]=1&pagination[pageSize]=${pageSize}`, {
      headers: {
        Authorization: `Bearer ${API_BEARER_TOKEN}`
      }
    })
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }
    
    const firstPageData = await res.json()
    let allLogsData = firstPageData.data || []
    const pagination = firstPageData.meta.pagination
    
    // Fetch additional pages if needed
    if (pagination.pageCount > 1) {
      const pagePromises = []
      for (let page = 2; page <= pagination.pageCount; page++) {
        pagePromises.push(
          fetch(`${API_BASE_URL}/api/inventory-logs?populate=*&pagination[page]=${page}&pagination[pageSize]=${pageSize}`, {
            headers: { Authorization: `Bearer ${API_BEARER_TOKEN}` }
          }).then(res => {
            if (!res.ok) throw new Error(`Failed to fetch page ${page}`)
            return res.json()
          })
        )
      }
      
      const additionalPagesData = await Promise.all(pagePromises)
      additionalPagesData.forEach(pageData => {
        if (pageData && pageData.data) {
          allLogsData = [...allLogsData, ...pageData.data]
        }
      })
    }
    
    inventoryLogs.value = allLogsData
    console.log('Inventory logs fetched successfully:', inventoryLogs.value.length, 'logs')
  } catch (e) {
    console.error('Error fetching inventory logs:', e)
    throw e
  }
}

const fetchAllData = async () => {
  loading.value = true
  error.value = null
  
  try {
    await Promise.all([
      fetchItems(),
      fetchRequisitions(),
      fetchInventoryLogs()
    ])
    await generateReport()
  } catch (e) {
    error.value = e
  } finally {
    loading.value = false
  }
}

// Report generation
const generateReport = async () => {
  if (!items.value.length || !requisitions.value.length || !inventoryLogs.value.length) return
  
  try {
    // Group items by category (similar to manage/index.vue)
    const itemsByCategory = {}
    for (const item of items.value) {
      const key = item.category ? item.category.replace(/\s+/g, '') : ''
      if (!itemsByCategory[key]) itemsByCategory[key] = []
      itemsByCategory[key].push(item)
    }

    // Calculate monthly acquisitions and additions
    const monthlyAcquisitions = calculateMonthlyAcquisitions()
    const monthlyAdditions = calculateMonthlyAdditions()

    // Generate report structure
    const report = []
    
    // Sort categories
    const sortedCategoryKeys = Object.keys(itemsByCategory).sort((a, b) => a.localeCompare(b, 'th'))
    
    for (const categoryKey of sortedCategoryKeys) {
      const categoryItems = itemsByCategory[categoryKey]
      const categoryData = {
        category: categoryKey || 'ไม่ระบุหมวดหมู่',
        items: categoryItems.map(item => {
          const monthlyData = {}
          let totalAcquisition = 0
          
          // Calculate data for each month column
          for (const monthCol of monthColumns.value) {
            const acquisition = monthlyAcquisitions[item.id]?.[monthCol.key] || 0
            const addition = monthlyAdditions[item.id]?.[monthCol.key] || 0
            monthlyData[monthCol.key] = {
              acquisition: acquisition,
              addition: addition
            }
            totalAcquisition += acquisition
          }
          
          return {
            ...item,
            monthlyData,
            totalAcquisition
          }
        })
      }
      
      report.push(categoryData)
    }
    
    reportData.value = report
  } catch (e) {
    console.error('Error generating report:', e)
    error.value = e
  }
}

const calculateMonthlyAcquisitions = () => {
  const acquisitions = {}
  
  for (const requisition of requisitions.value) {
    if (!requisition.pickupTime) continue
    
    const pickupDate = new Date(requisition.pickupTime)
    
    // Find which column this pickup date belongs to
    const matchingColumn = monthColumns.value.find(col => {
      const colStart = new Date(col.startDate)
      const colEnd = new Date(col.endDate)
      
      // Set time to compare dates only (not time)
      const pickupDateOnly = new Date(pickupDate.getFullYear(), pickupDate.getMonth(), pickupDate.getDate())
      const colStartOnly = new Date(colStart.getFullYear(), colStart.getMonth(), colStart.getDate())
      const colEndOnly = new Date(colEnd.getFullYear(), colEnd.getMonth(), colEnd.getDate())
      
      return pickupDateOnly >= colStartOnly && pickupDateOnly <= colEndOnly
    })
    
    if (!matchingColumn) continue
    
    for (const reqItem of requisition.requisition_items || []) {
      if (!reqItem.item) continue
      
      const itemId = reqItem.item.id
      if (!acquisitions[itemId]) acquisitions[itemId] = {}
      if (!acquisitions[itemId][matchingColumn.key]) acquisitions[itemId][matchingColumn.key] = 0
      
      acquisitions[itemId][matchingColumn.key] += reqItem.quantity
    }
  }
  
  return acquisitions
}

const calculateMonthlyAdditions = () => {
  const additions = {}
  
  for (const log of inventoryLogs.value) {
    if (!log.createdAt || log.type !== 'add') continue
    
    const logDate = new Date(log.createdAt)
    
    // Find which column this log date belongs to
    const matchingColumn = monthColumns.value.find(col => {
      const colStart = new Date(col.startDate)
      const colEnd = new Date(col.endDate)
      
      // Set time to compare dates only (not time)
      const logDateOnly = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate())
      const colStartOnly = new Date(colStart.getFullYear(), colStart.getMonth(), colStart.getDate())
      const colEndOnly = new Date(colEnd.getFullYear(), colEnd.getMonth(), colEnd.getDate())
      
      return logDateOnly >= colStartOnly && logDateOnly <= colEndOnly
    })
    
    if (!matchingColumn || !log.item) continue
    
    const itemId = log.item.id
    if (!additions[itemId]) additions[itemId] = {}
    if (!additions[itemId][matchingColumn.key]) additions[itemId][matchingColumn.key] = 0
    
    additions[itemId][matchingColumn.key] += log.quantityChanged
  }
  
  return additions
}

// Utility functions
const formatDateRange = () => {
  if (!startDate.value || !endDate.value) return ''
  
  const start = new Date(startDate.value)
  const end = new Date(endDate.value)
  
  const formatDate = (date) => formatDateThai(date, 'long')
  
  // Same date
  if (start.getTime() === end.getTime()) {
    return formatDate(start)
  }
  
  // Different dates
  return `${formatDate(start)} - ${formatDate(end)}`
}

// Excel export function
const exportToExcel = async () => {
  exportLoading.value = true
  
  try {
    // Import xlsx library from installed package
    const XLSX = await import('xlsx')
    
    // Prepare data for Excel
    const excelData = []
    
    // Add headers
    const headers = ['รายการ', 'หน่วย']
    for (const month of monthColumns.value) {
      headers.push(`${month.label} - จำนวนที่เพิ่ม`)
      headers.push(`${month.label} - จำนวนที่เบิก`)
    }
    headers.push('รวมเบิก')
    headers.push('คงเหลือ')
    excelData.push(headers)
    
    // Add data rows
    for (const categoryData of reportData.value) {
      // Add category header
      excelData.push([categoryData.category])
      
      // Add items
      for (const item of categoryData.items) {
        const row = [item.name, item.unit]
        
        for (const month of monthColumns.value) {
          row.push(item.monthlyData[month.key]?.addition || 0)
          row.push(item.monthlyData[month.key]?.acquisition || 0)
        }
        
        row.push(item.totalAcquisition)
        row.push(item.stockqnt)
        
        excelData.push(row)
      }
      
      // Add empty row between categories
      excelData.push([])
    }
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(excelData)
    
    // Set column widths
    const colWidths = [
      { wch: 30 }, // รายการ
      { wch: 10 }, // หน่วย
    ]
    for (let i = 0; i < monthColumns.value.length; i++) {
      colWidths.push({ wch: 12 }) // จำนวนที่เพิ่ม columns
      colWidths.push({ wch: 12 }) // จำนวนที่เบิก columns
    }
    colWidths.push({ wch: 12 }) // รวมเบิก
    colWidths.push({ wch: 12 }) // คงเหลือ
    ws['!cols'] = colWidths
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'รายงานการเบิกวัสดุ')
    
    // Generate filename
    const filename = `รายงานการเบิกวัสดุ_${formatDateRange().replace(/\s/g, '_')}.xlsx`
    
    // Save file
    XLSX.writeFile(wb, filename)
    
  } catch (error) {
    console.error('Error exporting to Excel:', error)
    // You might want to show an error message to the user here
  } finally {
    exportLoading.value = false
  }
}

// Lifecycle
onMounted(fetchAllData)
</script>

<style scoped>
.report-container {
  overflow-x: auto;
  max-width: 100%;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.report-table th,
.report-table td {
  border: 1px solid #e0e0e0;
  padding: 8px 12px;
  text-align: center;
  vertical-align: middle;
}

.sticky-column {
  position: sticky;
  left: 0;
  background-color: #fafafa;
  z-index: 2;
  min-width: 200px;
}

.report-table .item-column {
  width: 250px;
  text-align: left !important;
}

.month-header {
  background-color: #1976d2;
  color: white;
  font-weight: bold;
  width: 200px;
}

.sub-header {
  font-weight: bold;
  font-size: 12px;
  width: 100px;
}

.add-header {
  background-color: #4caf50;
  color: white;
}

.req-header {
  background-color: #ff9800;
  color: white;
}

.summary-header {
  background-color: #ff9800;
  color: white;
  font-weight: bold;
  width: 100px;
}

.stock-header {
  background-color: #7b1fa2;
  color: white;
  font-weight: bold;
  width: 100px;
}

.category-row {
  background-color: #f5f5f5;
}

.report-table .category-cell {
  font-weight: bold;
  font-size: 16px;
  text-align: left !important;
  background-color: #f5f5f5 !important;
  color: #1976d2;
}



.report-table .item-cell {
  text-align: left !important;
  background-color: #fafafa;
}

.data-cell {
  width: 80px;
  font-weight: 500;
}

.addition-cell {
  background-color: #e8f5e8;
  color: #2e7d32;
}

.acquisition-cell {
  background-color: #fff3e0;
  color: #f57c00;
}

.summary-cell {
  background-color: #fff3e0;
  color: #f57c00;
  font-weight: bold;
}

.stock-cell {
  background-color: #f3e5f5;
  color: #7b1fa2;
}


</style>