import type { FamilyMember, MemberCheckResult, MemberPreference, Product } from '@/types'
import { getPreferenceDef, getPreferenceLabel } from './preferences'

export function checkProduct(
  product: Product,
  members: FamilyMember[],
  preferences: MemberPreference[],
): MemberCheckResult[] {
  return members.map((member) => {
    const memberPrefs = preferences.filter((p) => p.member_id === member.id)
    const reasons: string[] = []
    let worst: 'ok' | 'warning' | 'danger' = 'ok'

    for (const pref of memberPrefs) {
      const def = getPreferenceDef(pref.type, pref.value)
      if (!def) continue

      const label = getPreferenceLabel(pref.type, pref.value)

      // Allergen check: tag present → danger
      if (def.allergenTags?.some((tag) => product.allergens.includes(tag))) {
        reasons.push(`enthält ${label}`)
        worst = 'danger'
        continue
      }

      // Forbidden analysis tags (e.g. non-vegan for vegan diet) → danger
      if (def.forbiddenAnalysisTags?.some((tag) => product.ingredientAnalysis.includes(tag))) {
        reasons.push(`nicht ${label.toLowerCase()}`)
        worst = 'danger'
        continue
      }

      // Required tags or proof labels → if neither present, warning
      const needsProof = def.requiredAnalysisTags || def.proofLabels
      if (needsProof) {
        const hasRequired =
          def.requiredAnalysisTags?.some((t) => product.ingredientAnalysis.includes(t)) ?? false
        const hasProofLabel = def.proofLabels?.some((l) => product.labels.includes(l)) ?? false
        if (!hasRequired && !hasProofLabel) {
          reasons.push(`unklar ob ${label.toLowerCase()}`)
          if (worst === 'ok') worst = 'warning'
        }
      }
    }

    return { member, status: worst, reasons }
  })
}
