import React, { useRef, useState } from "react";
import { Alert, Animated, Image, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { WebView } from "react-native-webview";
import { AxiosError } from "axios";
import { sendSupportReport } from "@/api/support";
import { ScreenShell } from "@/components/screen-shell";
import { useAppTheme } from "@/contexts/app-theme";

const FAQ_ITEMS = [
  {
    question: "¿Cómo funciona la detección de prendas?",
    answer:
      "La imagen que subes pasa por un modelo de detección que identifica cada prenda de forma separada.\n\nAl pulsar en una prenda, se busca primero en nuestra base de datos mediante similitud vectorial. Si no hay coincidencias, se realiza una búsqueda en internet. Una vez encontrados los resultados, se guardan en la base de datos para que futuras búsquedas de esa prenda, tuyas o de otros usuarios, ya estén respaldadas sin necesidad de volver a buscar en internet.",
  },
  {
    question: "¿Por qué no se detecta mi prenda?",
    answer:
      "Puede deberse a varios factores.\n\nAunque nuestros modelos están muy bien entrenados, prendas con colores muy similares entre sí pueden confundirse, ya que el modelo se basa en gran medida en diferencias de forma y color. También puede haber dificultades si las prendas están recortadas en la imagen o si la iluminación no es la adecuada.",
  },
  {
    question: "¿Los productos son oficiales?",
    answer:
      "No podemos garantizarlo. La búsqueda se realiza por similitud de imagen y los resultados mostrados corresponden a las coincidencias encontradas. Nuestra aplicación tiende a mostrar resultados de sitios oficiales, pero no siempre es así.",
  },
  {
    question: "¿Puedo buscar accesorios además de ropa?",
    answer:
      "Actualmente no. Nuestro modelo está entrenado para detectar prendas superiores, inferiores y de cuerpo completo. Estamos trabajando en mejoras para detectar calzado y complementos, pero de momento estas funciones no están disponibles.",
  },
  {
    question: "¿Los precios están actualizados?",
    answer:
      "En la mayoría de casos sí.\n\nLas búsquedas realizadas a través de internet recogen el precio directamente de la fuente original, por lo que suelen ser muy precisas. Sin embargo, los resultados obtenidos por similitud vectorial pueden tener precios desactualizados si llevan mucho tiempo sin ser buscados, o incluso el producto podría estar descatalogado.\n\nComo recomendación, si estás muy interesad@ en un producto, pulsa en la imagen del resultado para comprobar su estado actual en la fuente original.",
  },
  {
    question: "¿Funciona offline?",
    answer:
      "No. Stylens requiere conexión a internet en todo momento, ya que hay un contacto continuo con los servidores para el intercambio de información.",
  },
];

const TUTORIAL_VIDEO_URL = "https://www.youtube.com/embed/jg0H9uvZa-c?si=kB-8mazia0poljgC";
const IFrame = "iframe" as unknown as React.ElementType;

const TUTORIAL_ITEMS = [
  {
    title: "Guía de inicio rápido",
    helper: "Vídeo de prueba para validar el reproductor embebido.",
  },
  {
    title: "Mejores prácticas de fotografía",
    helper: "Vídeo de prueba para validar el reproductor embebido.",
  },
  {
    title: "Cómo usar favoritos",
    helper: "Vídeo de prueba para validar el reproductor embebido.",
  },
  {
    title: "Interpretar resultados",
    helper: "Vídeo de prueba para validar el reproductor embebido.",
  },
];

const ISSUE_ITEMS = [
  {
    title: "La cámara no funciona",
    answer:
      "Comprueba primero que Stylens tiene permiso para acceder a la cámara desde la configuración del dispositivo. Si el permiso ya está concedido, cierra y vuelve a abrir la aplicación para reiniciar la sesión de captura.\n\nSi el problema persiste, prueba a usar una imagen desde la galería. Así puedes confirmar si el fallo está en la cámara del dispositivo o solo en el acceso en tiempo real.",
  },
  {
    title: "Las imágenes no se suben",
    answer:
      "Suele deberse a una conexión inestable o a un archivo demasiado pesado. Verifica que tienes internet activo y espera unos segundos antes de reintentar la subida.\n\nTambién ayuda usar una foto bien recortada y con buena iluminación. Si la imagen sigue sin subir, prueba con otra para descartar que el archivo original esté corrupto.",
  },
  {
    title: "Resultados incorrectos",
    answer:
      "Los resultados pueden variar si la prenda aparece parcialmente tapada, con poca luz o mezclada con otras prendas de colores muy parecidos. Intenta usar una foto donde la prenda destaque más y ocupe una parte clara de la imagen.\n\nSi después de varios intentos el resultado sigue siendo malo, puede tratarse de una categoría que todavía no está bien cubierta por el modelo actual.",
  },
  {
    title: "Errores de conexión",
    answer:
      "Stylens necesita comunicarse constantemente con los servidores para procesar imágenes, consultar resultados y recuperar información de productos. Si aparece este problema, revisa tu red Wi‑Fi o datos móviles y vuelve a intentarlo.\n\nSi otras páginas o apps sí funcionan, espera un momento y repite la acción. Puede tratarse de una incidencia temporal del servicio o de una petición que haya expirado.",
  },
  {
    title: "Aplicación lenta",
    answer:
      "La lentitud suele notarse más al procesar imágenes grandes o cuando la conexión tarda en devolver resultados. Cerrar aplicaciones en segundo plano y volver a abrir Stylens suele mejorar el rendimiento en sesiones largas.\n\nTambién recomendamos usar imágenes nítidas pero no excesivamente pesadas. Si el retraso ocurre siempre en la misma acción, indícanoslo en el formulario de reporte para revisarlo con más detalle.",
  },
];

export default function SoporteScreen() {
  const { theme } = useAppTheme();
  const [query, setQuery] = useState("");
  const [issueType, setIssueType] = useState("Bug técnico");
  const [issueTitle, setIssueTitle] = useState("");
  const [issueText, setIssueText] = useState("");
  const [evidenceImages, setEvidenceImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [openTutorial, setOpenTutorial] = useState<number | null>(null);
  const [openIssue, setOpenIssue] = useState<number | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const animatedValues = useRef(FAQ_ITEMS.map(() => new Animated.Value(0))).current;
  const tutorialAnimatedValues = useRef(TUTORIAL_ITEMS.map(() => new Animated.Value(0))).current;
  const issueAnimatedValues = useRef(ISSUE_ITEMS.map(() => new Animated.Value(0))).current;
  const reportAnimatedValue = useRef(new Animated.Value(0)).current;

  const toggleFaq = (index: number) => {
    const isOpen = openFaq === index;
    if (!isOpen && openFaq !== null) {
      Animated.timing(animatedValues[openFaq], {
        toValue: 0,
        duration: 100,
        useNativeDriver: false,
      }).start();
    }
    Animated.timing(animatedValues[index], {
      toValue: isOpen ? 0 : 1,
      duration: isOpen ? 100 : 700,
      useNativeDriver: false,
    }).start();
    setOpenFaq(isOpen ? null : index);
  };

  const toggleTutorial = (index: number) => {
    const isOpen = openTutorial === index;
    if (!isOpen && openTutorial !== null) {
      Animated.timing(tutorialAnimatedValues[openTutorial], {
        toValue: 0,
        duration: 100,
        useNativeDriver: false,
      }).start();
    }
    Animated.timing(tutorialAnimatedValues[index], {
      toValue: isOpen ? 0 : 1,
      duration: isOpen ? 100 : 700,
      useNativeDriver: false,
    }).start();
    setOpenTutorial(isOpen ? null : index);
  };

  const toggleIssue = (index: number) => {
    const isOpen = openIssue === index;
    if (!isOpen && openIssue !== null) {
      Animated.timing(issueAnimatedValues[openIssue], {
        toValue: 0,
        duration: 100,
        useNativeDriver: false,
      }).start();
    }
    Animated.timing(issueAnimatedValues[index], {
      toValue: isOpen ? 0 : 1,
      duration: isOpen ? 100 : 700,
      useNativeDriver: false,
    }).start();
    setOpenIssue(isOpen ? null : index);
  };

  const toggleReport = () => {
    const nextOpen = !isReportOpen;
    Animated.timing(reportAnimatedValue, {
      toValue: nextOpen ? 1 : 0,
      duration: nextOpen ? 700 : 100,
      useNativeDriver: false,
    }).start();
    setIsReportOpen(nextOpen);
  };

  const handlePickEvidence = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería para adjuntar evidencias.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 1,
      allowsMultipleSelection: true,
      selectionLimit: 10,
    });

    if (result.canceled) {
      return;
    }

    setEvidenceImages((currentImages) => {
      const mergedImages = [...currentImages, ...result.assets];
      return mergedImages.filter(
        (asset, index, allAssets) => index === allAssets.findIndex((candidate) => candidate.uri === asset.uri)
      );
    });
  };

  const handleRemoveEvidence = (uriToRemove: string) => {
    setEvidenceImages((currentImages) => currentImages.filter((image) => image.uri !== uriToRemove));
  };

  const handleSendReport = async () => {
    const trimmedType = issueType.trim();
    const trimmedTitle = issueTitle.trim();
    const trimmedDescription = issueText.trim();

    if (!trimmedType) {
      Alert.alert("Falta información", "Selecciona un tipo de problema.");
      return;
    }
    if (!trimmedTitle) {
      Alert.alert("Falta información", "Escribe un título para el reporte.");
      return;
    }
    if (!trimmedDescription) {
      Alert.alert("Falta información", "Describe el problema antes de enviar.");
      return;
    }

    try {
      setIsSubmittingReport(true);
      await sendSupportReport({
        issueType: `Reporte - ${trimmedType}`,
        title: trimmedTitle,
        description: trimmedDescription,
        evidences: evidenceImages,
      });

      setIssueTitle("");
      setIssueText("");
      setEvidenceImages([]);
      setShowSuccessModal(true);
    } catch (error) {
      const fallback = "No se pudo enviar el reporte. Inténtalo de nuevo.";
      const detail =
        error instanceof AxiosError && typeof error.response?.data?.detail === "string"
          ? error.response.data.detail
          : fallback;
      Alert.alert("Error", detail || fallback);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <ScreenShell title="Soporte">
      <View style={[styles.heroCard, { backgroundColor: theme.surface }]}> 
        <View style={[styles.heroIconWrap, { backgroundColor: theme.accent }]}> 
          <Ionicons name="headset-outline" size={24} color="#fff" />
        </View>
        <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>Centro de soporte</Text>
        <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>¿Cómo podemos ayudarte?</Text>
      </View>

      <View style={[styles.searchWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
        <Ionicons name="search" size={18} color={theme.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar en la ayuda..."
          placeholderTextColor={theme.textMuted}
          style={[styles.searchInput, { color: theme.textPrimary }]}
        />
      </View>

      <View style={styles.cardSuccess}>
        <View style={styles.row}>
          <View style={styles.dot} />
          <Text style={styles.statusTitle}>Estado del sistema</Text>
        </View>
        <Text style={styles.statusText}>Todos los sistemas operativos - Sin incidencias</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.row}>
          <Ionicons name="help-circle-outline" size={20} color={theme.textPrimary} />
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Preguntas frecuentes</Text>
        </View>
        <View style={styles.listBlock}>
          {FAQ_ITEMS.map((item, index) => {
            const maxHeight = animatedValues[index].interpolate({
              inputRange: [0, 1],
              outputRange: [0, 500],
            });
            const isOpen = openFaq === index;
            return (
              <View key={index} style={[styles.faqItem, { borderColor: theme.border ?? "#e5e7eb" }]}>
                <Pressable
                  style={[styles.faqQuestion, { backgroundColor: isOpen ? "#fff" : "#f9fafb" }]}
                  onPress={() => toggleFaq(index)}
                >
                  <Text style={[styles.faqQuestionText, { color: isOpen ? "#111" : "#6b7280" }]}>{item.question}</Text>
                  <Ionicons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={theme.accent}
                  />
                </Pressable>
                <Animated.View style={{ maxHeight, overflow: "hidden" }}>
                  <View style={styles.faqAnswer}>
                    <Text style={[styles.faqAnswerText, { color: theme.textSecondary }]}>{item.answer}</Text>
                  </View>
                </Animated.View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}> 
        <View style={styles.row}>
          <Ionicons name="bulb-outline" size={20} color={theme.textPrimary} />
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Tutoriales y guías</Text>
        </View>
        <View style={styles.listBlock}>
          {TUTORIAL_ITEMS.map((item, index) => {
            const maxHeight = tutorialAnimatedValues[index].interpolate({
              inputRange: [0, 1],
              outputRange: [0, 430],
            });
            const isOpen = openTutorial === index;
            return (
              <View key={item.title} style={[styles.tutorialItem, { borderColor: theme.border ?? "#e5e7eb" }]}>
                <Pressable
                  style={[
                    styles.tutorialButton,
                    {
                      backgroundColor: isOpen ? "#fff" : "#faf5ff",
                      borderColor: isOpen ? theme.border ?? "#e5e7eb" : "#ddd6fe",
                    },
                  ]}
                  onPress={() => toggleTutorial(index)}
                >
                  <View style={styles.tutorialButtonContent}>
                    <Ionicons name="play-circle-outline" size={18} color={theme.accent} />
                    <Text style={[styles.tutorialButtonText, { color: isOpen ? "#111" : "#5b21b6" }]}>{item.title}</Text>
                  </View>
                  <Ionicons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={theme.accent}
                  />
                </Pressable>
                <Animated.View style={{ maxHeight, overflow: "hidden" }}>
                  <View style={styles.tutorialPanel}>
                    <Text style={[styles.tutorialHelper, { color: theme.textSecondary }]}>{item.helper}</Text>
                    <View style={[styles.videoFrame, { borderColor: theme.border ?? "#e5e7eb" }]}>
                      {Platform.OS === "web" ? (
                        <IFrame
                          src={TUTORIAL_VIDEO_URL}
                          title={item.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          style={styles.videoEmbed}
                        />
                      ) : (
                        <WebView
                          source={{ uri: TUTORIAL_VIDEO_URL }}
                          style={styles.video}
                          allowsFullscreenVideo
                          javaScriptEnabled
                          domStorageEnabled
                        />
                      )}
                    </View>
                  </View>
                </Animated.View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}> 
        <View style={styles.row}>
          <Ionicons name="alert-circle-outline" size={20} color={theme.textPrimary} />
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Solución de problemas</Text>
        </View>
        <View style={styles.listBlock}>
          {ISSUE_ITEMS.map((item, index) => {
            const maxHeight = issueAnimatedValues[index].interpolate({
              inputRange: [0, 1],
              outputRange: [0, 240],
            });
            const isOpen = openIssue === index;
            return (
              <View key={item.title} style={[styles.issueItem, { borderColor: isOpen ? theme.border ?? "#e5e7eb" : "#fed7aa" }]}>
                <Pressable
                  style={[styles.warnItem, { backgroundColor: isOpen ? "#fff" : "#fff7ed" }]}
                  onPress={() => toggleIssue(index)}
                >
                  <Text style={[styles.warnText, { color: isOpen ? "#111" : "#9a3412" }]}>{item.title}</Text>
                  <Ionicons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={isOpen ? theme.accent : "#ea580c"}
                  />
                </Pressable>
                <Animated.View style={{ maxHeight, overflow: "hidden" }}>
                  <View style={styles.issueAnswer}>
                    <Text style={[styles.issueAnswerText, { color: theme.textSecondary }]}>{item.answer}</Text>
                  </View>
                </Animated.View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}> 
        <Pressable
          style={[styles.reportButton, { backgroundColor: isReportOpen ? "#fff" : "#f0fdfa", borderColor: isReportOpen ? theme.border ?? "#e5e7eb" : "#a5f3fc" }]}
          onPress={toggleReport}
        >
          <View style={styles.reportButtonContent}>
            <Ionicons name="document-text-outline" size={18} color={theme.accent} />
            <Text style={[styles.reportButtonText, { color: isReportOpen ? "#111" : "#0f766e" }]}>Reportar un problema</Text>
          </View>
          <Ionicons
            name={isReportOpen ? "chevron-up" : "chevron-down"}
            size={18}
            color={theme.accent}
          />
        </Pressable>

        <Animated.View
          style={{
            maxHeight: reportAnimatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1100],
            }),
            overflow: "hidden",
          }}
        >
          <View style={styles.reportPanel}>
            <View style={styles.choiceList}>
              {[
                "Bug técnico",
                "Error en resultados",
                "Problema de rendimiento",
                "Otro",
              ].map((item) => (
                <Pressable
                  key={item}
                  style={[styles.choiceItem, issueType === item && styles.choiceItemSelected]}
                  onPress={() => setIssueType(item)}
                >
                  <Text style={[styles.choiceText, issueType === item && styles.choiceTextSelected]}>{item}</Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              value={issueTitle}
              onChangeText={setIssueTitle}
              placeholder="Título"
              placeholderTextColor={theme.textMuted}
              style={[styles.titleInput, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.textPrimary }]}
            />

            <TextInput
              value={issueText}
              onChangeText={setIssueText}
              placeholder="Describe el problema..."
              placeholderTextColor={theme.textMuted}
              multiline
              style={[styles.textArea, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.textPrimary }]}
            />

            <View style={[styles.evidencePanel, { borderColor: theme.border ?? "#e5e7eb", backgroundColor: theme.surface }]}>
              <View style={styles.evidenceHeader}>
                <Ionicons name="images-outline" size={18} color={theme.accent} />
                <Text style={[styles.evidenceTitle, { color: theme.textPrimary }]}>Evidencias</Text>
              </View>
              <Text style={[styles.evidenceText, { color: theme.textSecondary }]}>Adjunta capturas o imágenes del problema desde tu galería. La subida real se conectará después.</Text>
              <Pressable
                style={[styles.evidenceButton, { borderColor: theme.accentSoftStrong ?? "#a5f3fc", backgroundColor: theme.accentSoft ?? "#ecfeff" }]}
                onPress={handlePickEvidence}
              >
                <Ionicons name="add-circle-outline" size={18} color={theme.accent} />
                <Text style={[styles.evidenceButtonText, { color: theme.accent }]}>Agregar imágenes</Text>
              </Pressable>
              <View style={styles.evidenceList}>
                {evidenceImages.length === 0 ? (
                  <View style={[styles.evidenceChip, { borderColor: theme.border ?? "#e5e7eb" }]}>
                    <Ionicons name="image-outline" size={14} color={theme.textMuted} />
                    <Text style={[styles.evidenceChipText, { color: theme.textMuted }]}>Sin archivos adjuntos</Text>
                  </View>
                ) : (
                  <>
                    <Text style={[styles.evidenceCount, { color: theme.textSecondary }]}>{evidenceImages.length} imagen(es) seleccionada(s)</Text>
                    <View style={styles.evidenceGrid}>
                      {evidenceImages.map((image, index) => (
                        <View key={`${image.uri}-${index}`} style={[styles.evidenceThumbWrap, { borderColor: theme.border ?? "#e5e7eb" }]}>
                          <Image source={{ uri: image.uri }} style={styles.evidenceThumb} />
                          <Pressable
                            style={styles.evidenceRemoveButton}
                            onPress={() => handleRemoveEvidence(image.uri)}
                          >
                            <Ionicons name="close" size={12} color="#dc2626" />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </View>
            </View>

            <Pressable
              style={[styles.primaryButton, { backgroundColor: theme.accent }]}
              onPress={handleSendReport}
              disabled={isSubmittingReport}
            >
              <Ionicons name="send" size={16} color="#fff" />
              <Text style={styles.primaryButtonText}>{isSubmittingReport ? "Enviando..." : "Enviar reporte"}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>

      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <Pressable style={styles.successOverlay} onPress={() => setShowSuccessModal(false)}>
          <Pressable style={[styles.successCard, { backgroundColor: theme.surface }]} onPress={() => {}}>
            <Ionicons name="checkmark-circle" size={72} color="#22c55e" />
            <Text style={[styles.successText, { color: theme.textPrimary }]}>Se envio correctamente su reporte.</Text>
            <Pressable
              style={[styles.successButton, { backgroundColor: theme.accent }]}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.successButtonText}>Aceptar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    gap: 6,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#06b6d4",
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  searchWrap: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: "#111",
    fontSize: 14,
  },
  cardSuccess: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    borderRadius: 18,
    padding: 18,
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#22c55e",
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#065f46",
  },
  statusText: {
    fontSize: 14,
    color: "#047857",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  faqItem: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  faqQuestion: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 14,
  },
  faqAnswer: {
    backgroundColor: "#f9fafb",
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 6,
  },
  faqAnswerText: {
    fontSize: 13,
    lineHeight: 20,
  },
  cardText: {
    fontSize: 14,
    color: "#6b7280",
  },
  listBlock: {
    gap: 8,
  },
  listItem: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  listText: {
    flex: 1,
    color: "#374151",
    fontSize: 14,
  },
  tutorialItem: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  tutorialButton: {
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  tutorialButtonContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tutorialButtonText: {
    fontSize: 14,
    flex: 1,
  },
  tutorialPanel: {
    backgroundColor: "#f9fafb",
    padding: 14,
    gap: 10,
  },
  tutorialHelper: {
    fontSize: 13,
    lineHeight: 18,
  },
  videoFrame: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
    width: "100%",
    maxWidth: 560,
    aspectRatio: 16 / 9,
    alignSelf: "center",
  },
  video: {
    flex: 1,
  },
  videoEmbed: {
    width: "100%",
    height: "100%",
    borderWidth: 0,
  },
  issueItem: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  warnItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  warnText: {
    flex: 1,
    fontSize: 14,
  },
  issueAnswer: {
    backgroundColor: "#fffaf5",
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 6,
  },
  issueAnswerText: {
    fontSize: 13,
    lineHeight: 20,
  },
  reportButton: {
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  reportButtonContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reportButtonText: {
    flex: 1,
    fontSize: 14,
  },
  reportPanel: {
    backgroundColor: "#f9fafb",
    marginTop: 8,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  choiceList: {
    gap: 8,
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#111",
    fontSize: 14,
  },
  choiceItem: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  choiceItemSelected: {
    borderColor: "#7dd3fc",
    backgroundColor: "#ecfeff",
  },
  choiceText: {
    color: "#374151",
    fontSize: 14,
  },
  choiceTextSelected: {
    color: "#0e7490",
    fontWeight: "700",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 110,
    textAlignVertical: "top",
    color: "#111",
  },
  evidencePanel: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  evidenceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  evidenceTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  evidenceText: {
    fontSize: 13,
    lineHeight: 18,
  },
  evidenceButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  evidenceButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  evidenceList: {
    gap: 8,
  },
  evidenceCount: {
    fontSize: 12,
  },
  evidenceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  evidenceChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
  },
  evidenceChipText: {
    fontSize: 12,
  },
  evidenceThumbWrap: {
    width: 72,
    height: 72,
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
    position: "relative",
  },
  evidenceThumb: {
    width: "100%",
    height: "100%",
  },
  evidenceRemoveButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: "#06b6d4",
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  successOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  successCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: "center",
    gap: 14,
  },
  successText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  successButton: {
    marginTop: 4,
    minWidth: 120,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  successButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});