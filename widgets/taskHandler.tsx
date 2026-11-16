// widgets/taskHandler.tsx — Android calls this headlessly to draw/refresh the widget.
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { readWidgetSnapshot } from "@/services/widget";
import { renderTedSpaceWidget } from "@/widgets/TedSpaceWidget";

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (props.widgetAction === "WIDGET_DELETED") return;
  const data = await readWidgetSnapshot();
  props.renderWidget(renderTedSpaceWidget(data));
}
