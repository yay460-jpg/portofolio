package com.lithosite.mineservices.host

import android.app.Activity
import android.os.Bundle
import android.widget.TextView
import java.io.File

class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val status = TextView(this).apply {
            text = "Lithosite Mine Services\nHost runtime initializing..."
            textSize = 18f
            setPadding(32, 64, 32, 32)
        }
        setContentView(status)

        try {
            installDatabaseSeed()
            val bridge = MineServicesBridge(this)
            status.text = "Lithosite Mine Services\n" + bridge.healthcheck()
        } catch (error: Exception) {
            status.text = "Lithosite Mine Services\nHOST-005: runtime initialization failed"
        }
    }

    private fun installDatabaseSeed() {
        val target = File(filesDir, "Mine-Services-Database.xlsx")
        if (target.exists()) return

        assets.open("Mine-Services-Database.xlsx").use { input ->
            target.outputStream().use { output ->
                input.copyTo(output)
            }
        }
    }
}
