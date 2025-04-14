// Modificar o arquivo para priorizar formatCurrencyWithUserSettings

/**
 * Formata um valor numérico para exibição como moeda com base nas configurações do usuário
 * @param value Valor a ser formatado
 * @param currency Código da moeda (padrão: EUR)
 * @param showCents Exibir casas decimais (padrão: true)
 * @returns String formatada como moeda
 */
export function formatCurrencyWithUserSettings(value: number, currency = "EUR", showCents = true): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(value)
}

// Alias para manter compatibilidade com código existente
export const formatCurrency = formatCurrencyWithUserSettings
