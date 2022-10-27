import { Plugin } from "obsidian";
import { getAPI } from "obsidian-dataview";
import { DataArray } from "obsidian-dataview/lib/api/data-array";
import { Literal } from "obsidian-dataview/lib/data-model/value";
type DataviewPages = DataArray<Record<string, Literal> & { file: any }>;

export default class BulkTag extends Plugin {
	async onload() {
		this.app.workspace.onLayoutReady(() => {});
		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "bulk-tags-apply",
			name: "Bulk add tags",
			callback: () => {
				const metaEditPlugin = this.app.plugins.getPlugin("metaedit");
				const {
					createYamlProperty,
					getPropertyValue,
					update,
					getPropertiesInFile,
				} = metaEditPlugin.api;
				const dataview = getAPI(this.app);
				const query = `"_inbox"`;

				const notes = dataview?.pages(query) as DataviewPages;

				console.log(query);
				console.log(notes);
				const tagsToAdd = [];

				// notes.map(async (n) => {
				// 	const tags = await getPropertyValue("tags", n.file.path);
				// 	console.log(n.file.path);
				// 	console.log(tags);
				// });
				notes.map(async (n) => {
					// console.log(n);

					// update tags
					const tags = await getPropertyValue("tags", n.file.path);
					// console.log("existing tags", tags);
					if (tags && tags.length > 0) {
						const mergedTags = [...tagsToAdd, ...tags].unique();
						// replace the tags with merged new ones
						await update(
							"tags",
							`[${mergedTags.join(",")}]`,
							n.file.path
						);
					} else {
						// add the tags
						await createYamlProperty(
							"tags",
							`[${tagsToAdd.join(",")}]`,
							n.file.path
						);
					}

					// const newSetTags = await getPropertyValue(
					// 	"tags",
					// 	n.file.path
					// );
					// console.log("new set tags", newSetTags);

					// remove

					// privacy
					await update("latitude", "", n.file.path);
					await update("longitude", "", n.file.path);
					await update("altitude", "", n.file.path);

					const updatedAt = await getPropertyValue(
						"updated_at",
						n.file.path
					);
					if (updatedAt) {
						await createYamlProperty(
							"updated",
							updatedAt,
							n.file.path
						);
						await update("updated_at", "", n.file.path);
					}

					const date = await getPropertyValue("date", n.file.path);
					if (date) {
						await createYamlProperty("created", date, n.file.path);
						await update("date", "", n.file.path);
					}

					const url = await getPropertyValue("url", n.file.path);
					const source = await getPropertyValue(
						"source",
						n.file.path
					);

					if (url) {
						if (source) {
							await update("source", url, n.file.path);
						} else {
							await createYamlProperty(
								"source",
								url,
								n.file.path
							);
						}

						await update("url", "", n.file.path);
					} else {
						await update("source", "", n.file.path);
					}

					await createYamlProperty(
						"visibility",
						"private",
						n.file.path
					);

					await createYamlProperty(
						"status",
						"to-review",
						n.file.path
					);

					const allFrontmatter = await getPropertiesInFile(
						n.file.path
					);
					console.table(n.file.path);
					console.table(allFrontmatter);
				});
			},
		});
	}

	onunload() {}
}
