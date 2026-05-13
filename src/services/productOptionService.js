import { xmlToJson } from '../utils/xmlParser'
import { API_URL } from '../constants/constant'

function extractLocalizedText(field) {
  if (!field) return ''
  if (typeof field === 'string' || typeof field === 'number') return String(field)

  if (Array.isArray(field)) {
    for (const item of field) {
      const value = extractLocalizedText(item)
      if (value) return value
    }
    return ''
  }

  if (field['#text']) return String(field['#text'])
  if (field.language) return extractLocalizedText(field.language)

  return ''
}

export function extractProductOptionValueIds(product) {
  const optionValues = product?.associations?.product_option_values?.product_option_value
  if (!optionValues) return []

  const optionValueArray = Array.isArray(optionValues) ? optionValues : [optionValues]

  return optionValueArray
    .map((optionValue) => String(optionValue?.id?.['#text'] || optionValue?.id || '').trim())
    .filter(Boolean)
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id))
}

async function getProductOptionValuesDetails(optionValueIds) {
  if (!optionValueIds.length) return []

  const filterValue = `[${optionValueIds.join('|')}]`
  const url = `${API_URL}/product_option_values?filter[id]=${filterValue}&display=full`

  try {
    const response = await fetch(url)
    const xmlData = await response.text()
    const jsonData = await xmlToJson(xmlData)

    const optionValues = jsonData?.prestashop?.product_option_values?.product_option_value || []
    const optionValueArray = Array.isArray(optionValues) ? optionValues : [optionValues]

    return optionValueArray
      .filter(Boolean)
      .map((optionValue) => ({
        id: Number(optionValue.id?.['#text'] || optionValue.id || ''),
        id_attribute_group: Number(optionValue.id_attribute_group?.['#text'] || optionValue.id_attribute_group || ''),
        name: extractLocalizedText(optionValue.name),
        color: String(optionValue.color?.['#text'] || optionValue.color || '')
      }))
      .filter((optionValue) => Number.isFinite(optionValue.id))
  } catch (error) {
    console.error('Erreur lors de la récupération des product_option_values:', error)
    return []
  }
}

async function getProductOptionGroupsDetails(optionValues) {
  const uniqueGroupIds = [...new Set(
    optionValues
      .map((optionValue) => Number(optionValue?.id_attribute_group))
      .filter(Number.isFinite)
  )]

  if (!uniqueGroupIds.length) return []

  try {
    const groups = await Promise.all(uniqueGroupIds.map(async (groupId) => {
      const url = `${API_URL}/product_options/${groupId}?display=full`

      const response = await fetch(url)
      const xmlData = await response.text()
      const jsonData = await xmlToJson(xmlData)

      const group = jsonData?.prestashop?.product_option
      if (!group) return null

      return {
        id: Number(group.id?.['#text'] || group.id || groupId),
        name: extractLocalizedText(group.name),
        group_type: String(group.group_type?.['#text'] || group.group_type || '').toLowerCase()
      }
    }))

    return groups.filter(Boolean)
  } catch (error) {
    console.error('Erreur lors de la récupération des product_options:', error)
    return []
  }
}

export async function getProductOptionsStructure(product) {
  const optionValueIds = extractProductOptionValueIds(product)
  if (!optionValueIds.length) return []

  const optionValues = await getProductOptionValuesDetails(optionValueIds)
  if (!optionValues.length) return []

  const optionGroups = await getProductOptionGroupsDetails(optionValues)
  if (!optionGroups.length) return []

  const groupsById = new Map(
    optionGroups.map((group) => [String(group.id), { ...group, valeurs: [] }])
  )

  optionValues.forEach((optionValue) => {
    const groupId = String(Number(optionValue.id_attribute_group))
    const group = groupsById.get(groupId)
    if (!group) return

    group.valeurs.push({
      id: Number(optionValue.id),
      nom: optionValue.name,
      color: optionValue.color || ''
    })
  })

  return optionGroups
    .map((group) => groupsById.get(String(group.id)))
    .filter(Boolean)
    .map((group) => ({
      id: Number(group.id),
      nom: group.name,
      type: group.group_type,
      valeurs: group.valeurs
    }))
}